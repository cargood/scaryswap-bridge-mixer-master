import { Percent } from '@uniswap/sdk'
import React from 'react'
import { ONE_BIPS } from '../../constants'

export default function FormattedPriceImpact({ priceImpact }: { priceImpact?: Percent }) {
  return <div>{priceImpact ? (priceImpact.lessThan(ONE_BIPS) ? '<0.01%' : `≈ ${priceImpact.toFixed(2)}%`) : '-'}</div>
}
