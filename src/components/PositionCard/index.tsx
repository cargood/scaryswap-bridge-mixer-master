import { JSBI, Pair, Percent, TokenAmount } from '@uniswap/sdk'
import { darken } from 'polished'
import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { Disclosure } from '@headlessui/react'
import { Tooltip } from '@blockstack/ui'
import Card from '../Card'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween } from '../Row'
import { StyledIcon } from 'components/styled-icon'
import { Dots } from '../swap/styleds'
import { useTotalSupply } from 'data/TotalSupply'
import { useActiveWeb3React } from 'hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import { TYPE } from 'theme'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/wrappedCurrency'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.raw, JSBI.BigInt(0)) ? (
        <div className="w-full p-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
          <h4 className="text-xs font-normal text-indigo-700 uppercase font-headings">Your position</h4>
          <dl className="mt-2 space-y-1">
            <div className="sm:grid sm:grid-cols-2 sm:gap-4">
              <dt className="inline-flex items-center text-base font-medium text-indigo-500">
                <div className="flex mr-2 -space-x-2">
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
                </div>
                {currency0.symbol}/{currency1.symbol}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              </dd>
            </div>
            <div className="sm:grid sm:grid-cols-2 sm:gap-4">
              <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                Your pool share:
              </dt>
              <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
              </dd>
            </div>
            <div className="sm:grid sm:grid-cols-2 sm:gap-4">
              <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                {currency0.symbol}:
              </dt>
              <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                {token0Deposited ? token0Deposited.toSignificant(6) : '-'}
              </dd>
            </div>
            <div className="sm:grid sm:grid-cols-2 sm:gap-4">
              <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                {currency1.symbol}:
              </dt>
              <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                {token1Deposited ? token1Deposited.toSignificant(6) : '-'}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="w-full p-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            <span role="img" aria-label="wizard-icon">
              ⭐️
            </span>{' '}
            By adding liquidity you&apos;ll earn 1% of all trades on this pair proportional to your share of the pool.
            Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
          </TYPE.subHeader>
        </div>
      )}
    </>
  )
}

export default function FullPositionCard({ pair, border, stakedBalance }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <>
      <Disclosure as="div" key={''} className="">
        {({ open }) => (
          <>
            <dt className="text-lg">
              <Disclosure.Button className="flex items-start justify-between w-full text-left text-gray-400">
                <div className="flex items-center">
                  <div className="flex -space-x-2 shrink-0">
                    <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
                  </div>
                  <p className="ml-3 text-base text-gray-800 dark:text-zinc-100">
                    {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
                  </p>
                </div>
                <span className="flex items-center ml-6 h-7">
                  <StyledIcon
                    as="ChevronDownIcon"
                    size={6}
                    className={`${open ? '-rotate-180' : 'rotate-0'} transform`}
                  />
                </span>
              </Disclosure.Button>
            </dt>
            <Disclosure.Panel as="dd" className="mt-2">
              <div className="w-full p-4 mt-4 border border-indigo-200 rounded-lg shadow-sm bg-indigo-50 dark:bg-indigo-200">
                <h4 className="text-xs text-indigo-700 uppercase font-headings">Pool share</h4>

                <dl className="mt-2 space-y-1">
                  <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                    <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                      Your total pool tokens:
                      <div className="ml-2">
                        <Tooltip
                          className="z-10"
                          shouldWrapChildren={true}
                          label={`Indicates the total amount of LP tokens you have in your wallet`}
                        >
                          <StyledIcon
                            as="InformationCircleIcon"
                            size={4}
                            className="block text-indigo-400 dark:text-indigo-500"
                          />
                        </Tooltip>
                      </div>
                    </dt>
                    <dt className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                      {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                    </dt>
                  </div>
                </dl>

                <dl className="mt-4 space-y-1">
                  <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                    <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                      Your pool share
                      <div className="ml-2">
                        <Tooltip
                          className="z-10"
                          shouldWrapChildren={true}
                          label={`The percentual share of LP tokens you own against the whole pool supply`}
                        >
                          <StyledIcon
                            as="InformationCircleIcon"
                            size={4}
                            className="block text-indigo-400 dark:text-indigo-500"
                          />
                        </Tooltip>
                      </div>
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                      {poolTokenPercentage
                        ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                        : '-'}
                    </dd>
                  </div>

                  <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                    <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                      Pooled {currency0.symbol}:
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                      {token0Deposited?.toSignificant(6)}
                    </dd>
                  </div>

                  <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                    <dt className="inline-flex items-center text-sm font-medium text-indigo-500 dark:text-indigo-700">
                      Pooled {currency1.symbol}:
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-indigo-900 sm:mt-0 sm:text-right">
                      {token1Deposited?.toSignificant(6)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid grid-flow-row-dense grid-cols-2 gap-2 mt-4">
                <NavLink
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
                >
                  Remove
                </NavLink>
                <NavLink
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                >
                  Add
                </NavLink>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  )
}
