import { Trade, TradeType } from '@uniswap/sdk'
import React, { useContext, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { Tooltip } from '@blockstack/ui'
import { ThemeContext } from 'styled-components'
import { StyledIcon } from 'components/styled-icon'
import { AutoColumn } from '../Column'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'
import { useIsAllowedZeroFee } from 'state/user/hooks'
import { Field } from 'state/swap/actions'
import { TYPE } from 'theme'
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  formatExecutionPrice,
  warningSeverity
} from 'utils/prices'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm
}: {
  trade: Trade
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
}) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useContext(ThemeContext)
  const slippageAdjustedAmounts = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [
    allowedSlippage,
    trade
  ])
  const isAllowedZeroFee = useIsAllowedZeroFee()
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade, isAllowedZeroFee)
  const severity = warningSeverity(priceImpactWithoutFee)

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center" className="mb-1">
          <Text fontWeight={400} fontSize={14} color={theme.text2}>
            Price
          </Text>
          <Text
            fontWeight={500}
            fontSize={14}
            color={theme.text1}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px'
            }}
          >
            {formatExecutionPrice(trade, showInverted)}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween className="mb-1">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              {trade.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum sold'}
            </TYPE.black>
            <div className="ml-2">
              <Tooltip
                className="z-10"
                shouldWrapChildren={true}
                label={`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`}
              >
                <StyledIcon as="InformationCircleIcon" size={4} className="block text-zinc-600 dark:text-slate-300" />
              </Tooltip>
            </div>
          </RowFixed>
          <RowFixed>
            <TYPE.black fontSize={14}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
            </TYPE.black>
            <TYPE.black fontSize={14} marginLeft={'4px'}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? trade.outputAmount.currency.symbol
                : trade.inputAmount.currency.symbol}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween className="mb-1">
          <RowFixed>
            <TYPE.black color={theme.text2} fontSize={14} fontWeight={400}>
              Price Impact
            </TYPE.black>
            <div className="ml-2">
              <Tooltip
                className="z-10"
                shouldWrapChildren={true}
                label={`The difference between the market price and estimated price due to trade size.`}
              >
                <StyledIcon as="InformationCircleIcon" size={4} className="block text-zinc-600 dark:text-slate-300" />
              </Tooltip>
            </div>
          </RowFixed>
          <TYPE.black fontSize={14}>
            <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
          </TYPE.black>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Liquidity Provider Fee
            </TYPE.black>
            <div className="ml-2">
              <Tooltip
                className="z-10"
                shouldWrapChildren={true}
                label={`A portion of each trade (${
                  isAllowedZeroFee ? '0%' : '1%'
                }) goes to liquidity providers as a protocol incentive.`}
              >
                <StyledIcon as="InformationCircleIcon" size={4} className="block text-zinc-600 dark:text-slate-300" />
              </Tooltip>
            </div>
          </RowFixed>
          <TYPE.black fontSize={14}>
            {realizedLPFee ? realizedLPFee?.toSignificant(6) + ' ' + trade.inputAmount.currency.symbol : '-'}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>

      <AutoRow>
        <button
          type="button"
          disabled={disabledConfirm}
          onClick={onConfirm}
          className={`${
            disabledConfirm
              ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
              : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
          }
            w-full inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-lg rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {severity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
        </button>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
