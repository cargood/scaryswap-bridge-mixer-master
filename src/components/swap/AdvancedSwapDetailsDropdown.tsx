import React from 'react'
import styled from 'styled-components'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'
import { useLastTruthy } from 'hooks/useLast'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  z-index: -1;
  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)

  return (
    <AdvancedDetailsFooter
      show={Boolean(trade)}
      className="w-full max-w-md p-4 pt-8 -mt-4 border border-indigo-200 rounded-b-lg shadow-sm bg-indigo-50 dark:bg-indigo-200"
    >
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}
