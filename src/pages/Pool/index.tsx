import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Pair } from '@uniswap/sdk'
import SwapPoolHeader from 'components/swap/SwapPoolHeader'
import { StyledIcon } from 'components/styled-icon'
import { Dots } from 'components/swap/styleds'
import FullPositionCard from 'components/PositionCard'
import Card from 'components/Card'
import { TYPE } from 'theme'
import { usePairs } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )

  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )
  const [, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(account ?? undefined, liquidityTokens)

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = tokenPairsWithLiquidityTokens
  // const liquidityTokensWithBalances = useMemo(
  //   () =>
  //     tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
  //       v2PairsBalances[liquidityToken.address]?.greaterThan('0')
  //     ),
  //   [tokenPairsWithLiquidityTokens, v2PairsBalances]
  // )

  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  return (
    <>
      <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
        <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow dark:bg-zinc-800">
          <div className="flex flex-col p-4">
            <SwapPoolHeader tab="pool" />

            <div className="p-3">
              <h3 className="text-xl leading-6 font-headings mb-4">Your liquidity positions</h3>
              {!account ? (
                <Card padding="40px">
                  <TYPE.body color={theme.text3} textAlign="center">
                    Connect to a wallet to view your liquidity.
                  </TYPE.body>
                </Card>
              ) : v2IsLoading ? (
                <EmptyProposals>
                  <TYPE.body color={theme.text3} textAlign="center">
                    <Dots>Loading</Dots>
                  </TYPE.body>
                </EmptyProposals>
              ) : allV2PairsWithLiquidity?.length > 0 ? (
                <>
                  {allV2PairsWithLiquidity.map((v2Pair) => (
                    <div key={v2Pair.liquidityToken.address} className="mt-6 space-y-6">
                      <FullPositionCard pair={v2Pair} />
                    </div>
                  ))}
                </>
              ) : (
                <EmptyProposals>
                  <TYPE.body color={theme.text3} textAlign="center">
                    No liquidity found.
                  </TYPE.body>
                </EmptyProposals>
              )}
            </div>

            <div className="flex items-start flex-1 mt-8">
              <span className="flex p-2 bg-gray-100 rounded-lg">
                <StyledIcon as="CashIcon" size={6} className="text-indigo-500" />
              </span>
              <p className="ml-4 text-sm text-gray-500 dark:text-zinc-400">
                By adding liquidity, you will earn 1% on trades for this pool, proportional to your share of liquidity.
                Earned fees are added back to the pool and claimable by removing liquidity.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
