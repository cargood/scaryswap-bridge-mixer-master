import { Trade, TradeType } from '@uniswap/sdk'
import React from 'react'
import { Tooltip } from '@blockstack/ui'
import { StyledIcon } from 'components/styled-icon'
import FormattedPriceImpact from './FormattedPriceImpact'
import { useUserSlippageTolerance, useIsAllowedZeroFee } from 'state/user/hooks'
import { Field } from 'state/swap/actions'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from 'utils/prices'

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
  const isAllowedZeroFee = useIsAllowedZeroFee()
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade, isAllowedZeroFee)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts: any = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
          {isExactIn ? 'Minimum received' : 'Maximum sold'}
          <div className="ml-2">
            <Tooltip
              className="z-10"
              shouldWrapChildren={true}
              label={`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`}
            >
              <StyledIcon as="InformationCircleIcon" size={4} className="block text-indigo-400 dark:text-indigo-500" />
            </Tooltip>
          </div>
        </dt>
        <dd className="inline-flex justify-end mt-1 text-sm font-semibold text-indigo-900">
          <div className="mr-1 truncate">
            {isExactIn
              ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ??
                '-'
              : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ?? '-'}
          </div>
        </dd>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
          Price Impact
          <div className="ml-2">
            <Tooltip
              className="z-10"
              shouldWrapChildren={true}
              label={`The difference between the market price and estimated price due to trade size.`}
            >
              <StyledIcon as="InformationCircleIcon" size={4} className="block text-indigo-400 dark:text-indigo-500" />
            </Tooltip>
          </div>
        </dt>
        <dd className="inline-flex justify-end mt-1 text-sm font-semibold text-indigo-900">
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </dd>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
          Liquidity Provider fee
          <div className="ml-2">
            <Tooltip
              className="z-10"
              shouldWrapChildren={true}
              label={`A portion of each trade (${
                isAllowedZeroFee ? '0%' : '1%'
              }) goes to liquidity providers as a protocol incentive.`}
            >
              <StyledIcon as="InformationCircleIcon" size={4} className="block text-indigo-400 dark:text-indigo-500" />
            </Tooltip>
          </div>
        </dt>
        <dd className="inline-flex justify-end mt-1 text-sm font-semibold text-indigo-900">
          <div className="mr-1 truncate">
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
          </div>
        </dd>
      </div>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  return <dl className="space-y-1">{trade && <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />}</dl>
}
