import { Currency, CurrencyAmount, Pair, Token, Trade, TradeType, Route, TokenAmount, ETHER, WETH } from '@uniswap/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES, BIG_INT_ZERO } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { CustomTrade } from 'data/CustomTrade'
import { wrappedCurrency, wrappedCurrencyAmount, changeCurrency } from 'utils/wrappedCurrency'

import { useActiveWeb3React } from './index'
import { useUnsupportedTokens } from './Tokens'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useV2RouterContract, useV2FactoryContract } from 'hooks/useContract'
import { useSetAllowedZeroFee } from 'state/user/hooks';


const chainId = 250

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
          // the direct pair
          [tokenA, tokenB],
          // token A against all bases
          ...bases.map((base): [Token, Token] => [tokenA, base]),
          // token B against all bases
          ...bases.map((base): [Token, Token] => [tokenB, base]),
          // each base against all bases
          ...basePairs
        ]
          .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
          .filter(([t0, t1]) => t0.address !== t1.address)
          .filter(([tokenA, tokenB]) => {
            if (!chainId) return true
            const customBases = CUSTOM_BASES[chainId]
            if (!customBases) return true

            const customBasesA: Token[] | undefined = customBases[tokenA.address]
            const customBasesB: Token[] | undefined = customBases[tokenB.address]

            if (!customBasesA && !customBasesB) return true

            if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false
            if (customBasesB && !customBasesB.find(base => tokenA.equals(base))) return false

            return true
          })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  )

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */

function bestTradeExactIn(
  pairs: Pair[],
  outAmountsData: any,
  currencyAmountIn: CurrencyAmount | undefined,
  currencyOut: Currency | undefined
): Trade | null {
  if (currencyAmountIn && currencyOut && pairs.length > 0) {
    let bestTrades: Trade | null = null
    const amountIn = wrappedCurrencyAmount(currencyAmountIn, chainId)
    const tokenOut = wrappedCurrency(currencyOut, chainId)
    if (!amountIn || !tokenOut) return null
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      const outAmountData = outAmountsData

      if (!pair.token0.equals(amountIn.token) && !pair.token1.equals(amountIn.token)) continue
      if (pair.reserve0.equalTo(BIG_INT_ZERO) || pair.reserve1.equalTo(BIG_INT_ZERO)) continue

      const amountOut = pair.getOutputAmount(amountIn)[0]

      if (amountOut.token.equals(tokenOut) && outAmountData.result) {
        const outToken = new TokenAmount(
          tokenOut,
          Math.floor(
            (outAmountData.result[0][1] / outAmountData.result[0][0]) * Number(amountIn.numerator.toString())
          ).toLocaleString('fullwide', {
            useGrouping: false
          })
        )
        const customTrade = new CustomTrade(
          new Route([pair], currencyAmountIn.currency, currencyOut),
          currencyAmountIn,
          outToken,
          TradeType.EXACT_INPUT
        )
        bestTrades = new Trade(
          customTrade.route,
          customTrade.tradeType,
          customTrade.inputAmount,
          customTrade.outputAmount,
          customTrade.executionPrice,
          customTrade.nextMidPrice,
          customTrade.priceImpact
        )
      } else if (pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length))
        bestTradeExactIn(pairsExcludingThisPair, outAmountsData, amountOut, currencyOut)
      }
    }
    return bestTrades
  }
  return null
}

function bestTradeExactOut(
  pairs: Pair[],
  inAmount: any,
  currencyIn: Currency | undefined,
  currencyAmountOut: CurrencyAmount | undefined
): Trade | null {
  try {
    if (currencyAmountOut && currencyIn && pairs.length > 0) {
      let bestTrades: Trade | null = null
      const amountOut = wrappedCurrencyAmount(currencyAmountOut, chainId)
      const tokenIn = wrappedCurrency(currencyIn, chainId)
      if (!amountOut || !tokenIn) return null
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        const inAmountData = inAmount

        if (!pair.token0.equals(amountOut.token) && !pair.token1.equals(amountOut.token)) continue
        if (pair.reserve0.equalTo(BIG_INT_ZERO) || pair.reserve1.equalTo(BIG_INT_ZERO)) continue

        const amountIn = pair.getInputAmount(amountOut)[0]

        if (amountIn.token.equals(tokenIn) && inAmountData.result) {
          const inToken = new TokenAmount(
            tokenIn,
            Math.floor(
              (inAmountData.result[0][0] / inAmountData.result[0][1]) * Number(amountOut.numerator.toString())
            ).toLocaleString('fullwide', {
              useGrouping: false
            })
          )
          const customTrade: CustomTrade = new CustomTrade(
            new Route([pair], currencyIn, currencyAmountOut.currency),
            currencyAmountOut,
            inToken,
            TradeType.EXACT_OUTPUT
          )
          bestTrades = new Trade(
            customTrade.route,
            customTrade.tradeType,
            customTrade.inputAmount,
            customTrade.outputAmount,
            customTrade.executionPrice,
            customTrade.nextMidPrice,
            customTrade.priceImpact
          )
        } else if (pairs.length > 1) {
          const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length))
          bestTradeExactOut(pairsExcludingThisPair, inAmount, currencyIn, amountIn)
        }
      }
      return bestTrades
    }
    return null
  } catch (e) {
    return null
  }
}

export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const routerContract = useV2RouterContract()
  const factoryContract = useV2FactoryContract()

  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)

  let tokenIn: Token | undefined;
  let tokenOut: Token | undefined;
  tokenIn = wrappedCurrency(currencyAmountIn?.currency, chainId);
  tokenOut = wrappedCurrency(currencyOut, chainId);
  if (tokenIn?.address === tokenOut?.address) {
    tokenIn = changeCurrency(currencyAmountIn?.currency, chainId);
    tokenOut = changeCurrency(currencyOut, chainId);
  }

  let callData = undefined
  if (currencyAmountIn && tokenIn && tokenOut) {
    callData = [
      (Number(currencyAmountIn.toExact()) * 10 ** Number(currencyAmountIn.currency.decimals)).toLocaleString(
        'fullwide',
        {
          useGrouping: false
        }
      ),
      [tokenIn.address, tokenOut.address]
    ]
  }

  let pairAddress = undefined
  if (tokenIn && tokenOut) {
    pairAddress = Pair.getAddress(tokenIn, tokenOut)
  }

  const allowedZeroFee = useSingleCallResult(factoryContract, 'allowedZeroFeePairAddress', [pairAddress])?.result
  useSetAllowedZeroFee(allowedZeroFee ? allowedZeroFee[0] : undefined)

  const outAmount = useSingleCallResult(routerContract, 'getAmountsOut', callData ? callData : [undefined])

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      const bestTradeSoFar = bestTradeExactIn(allowedPairs, outAmount, currencyAmountIn, currencyOut)
      return bestTradeSoFar
    }

    return null
  }, [allowedPairs, currencyAmountIn, currencyOut, outAmount])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {

  let tokenIn: Token | undefined;
  let tokenOut: Token | undefined;
  tokenIn = wrappedCurrency(currencyIn, chainId)
  tokenOut = wrappedCurrency(currencyAmountOut?.currency, chainId)
  if (tokenIn?.address === tokenOut?.address) {
    tokenIn = changeCurrency(currencyIn, chainId)
    tokenOut = changeCurrency(currencyAmountOut?.currency, chainId)
  }

  const routerContract = useV2RouterContract()
  const factoryContract = useV2FactoryContract()

  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  let callData = undefined
  if (currencyAmountOut && tokenIn && tokenOut) {
    callData = [
      (Number(currencyAmountOut.toExact()) * 10 ** Number(currencyAmountOut.currency.decimals)).toLocaleString(
        'fullwide',
        {
          useGrouping: false
        }
      ),
      [tokenIn.address, tokenOut.address]
    ]
  }

  let pairAddress = undefined
  if (tokenIn && tokenOut) {
    pairAddress = Pair.getAddress(tokenIn, tokenOut)
  }

  const allowedZeroFee = useSingleCallResult(factoryContract, 'allowedZeroFeePairAddress', [pairAddress])?.result
  useSetAllowedZeroFee(allowedZeroFee ? allowedZeroFee[0] : undefined)

  const inAmount = useSingleCallResult(routerContract, 'getAmountsIn', callData ? callData : [undefined])

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      const bestTradeSoFar = bestTradeExactOut(allowedPairs, inAmount, currencyIn, currencyAmountOut)
      return bestTradeSoFar
    }

    return null
  }, [currencyIn, currencyAmountOut, allowedPairs, inAmount])
}

export function useIsTransactionUnsupported(currencyIn?: Currency, currencyOut?: Currency): boolean {
  const unsupportedToken: { [address: string]: Token } = useUnsupportedTokens()
  const { chainId } = useActiveWeb3React()

  const tokenIn = wrappedCurrency(currencyIn, chainId)
  const tokenOut = wrappedCurrency(currencyOut, chainId)

  // if unsupported list loaded & either token on list, mark as unsupported
  if (unsupportedToken) {
    if (tokenIn && Object.keys(unsupportedToken).includes(tokenIn.address)) {
      return true
    }
    if (tokenOut && Object.keys(unsupportedToken).includes(tokenOut.address)) {
      return true
    }
  }

  return false
}
