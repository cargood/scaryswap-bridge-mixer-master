import React from 'react'
import { Price } from '@uniswap/sdk'
import { StyledIcon } from 'components/styled-icon'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)

  return (
    <>
      <div className="flex items-center justify-end mt-2">
        {show ? (
          <>
            <p className="text-sm font-semibold text-right text-gray-400 dark:text-zinc-200">
              {showInverted
                ? `1 ${price?.baseCurrency?.symbol} ≈ ${formattedPrice ?? '-'} ${price?.quoteCurrency?.symbol}`
                : `1 ${price?.quoteCurrency?.symbol} ≈ ${formattedPrice ?? '-'} ${price?.baseCurrency?.symbol}`}
            </p>
            <button
              type="button"
              onClick={() => setShowInverted(!showInverted)}
              className="ml-2 text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-400"
            >
              <StyledIcon as="SwitchHorizontalIcon" size={5} />
            </button>
          </>
        ) : (
          '-'
        )}
      </div>
    </>
  )
}
