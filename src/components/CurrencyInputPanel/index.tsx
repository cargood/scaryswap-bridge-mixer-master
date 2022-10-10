import { Currency, Pair } from '@uniswap/sdk'
import React, { useState, useCallback } from 'react'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { StyledIcon } from 'components/styled-icon'
import { Input as NumericalInput } from '../NumericalInput'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  showCommonBases?: boolean
  customBalanceText?: string
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  otherCurrency,
  showCommonBases,
  customBalanceText
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])
  return (
    <>
      <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
        <div className="flex items-center p-4 pb-2">
          <button
            className={`relative py-2 pl-3 ${
              disableCurrencySelect ? 'pr-3' : 'pr-10'
            } text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-900`}
            onClick={() => {
              if (!disableCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <span className="flex items-center">
              {pair ? (
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={20} margin={true} />
              ) : currency ? (
                <CurrencyLogo currency={currency} size={'20px'} />
              ) : null}
              {pair ? (
                <span className="block ml-3 truncate dark:text-zinc-50">
                  {pair?.token0.symbol}:{pair?.token1.symbol}
                </span>
              ) : (
                <span className="block ml-3 truncate dark:text-zinc-50">
                  {(currency && currency.symbol && currency.symbol.length > 20
                    ? currency.symbol.slice(0, 4) +
                      '...' +
                      currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                    : currency?.symbol) || 'Select'}
                </span>
              )}
            </span>
            {!disableCurrencySelect ? (
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 ml-3 pointer-events-none">
                <StyledIcon as="SelectorIcon" size={5} className="text-gray-400" />
              </span>
            ) : null}
          </button>

          <label htmlFor="tokenXAmount" className="sr-only">
            {pair ? `${pair?.token0.symbol}:${pair?.token1.symbol}` : currency?.symbol}
          </label>
          <NumericalInput
            className="token-amount-input"
            value={value}
            onUserInput={val => {
              onUserInput(val)
            }}
          />
        </div>

        <div className="flex items-center justify-end p-4 pt-0 text-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start">
              <p className="text-gray-500 dark:text-zinc-50">
                {!hideBalance && !!currency && selectedCurrencyBalance
                  ? (customBalanceText ?? 'Balance: ') + selectedCurrencyBalance?.toSignificant(6)
                  : ' -'}
              </p>
              {account && currency && showMaxButton && label !== 'To' && (
                <button
                  type="button"
                  onClick={onMax}
                  className="p-1 ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                >
                  MAX
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </>
  )
}
