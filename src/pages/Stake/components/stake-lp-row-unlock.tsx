import React, { useState, useCallback } from 'react'
import { Disclosure } from '@headlessui/react'
import { Tooltip } from '@blockstack/ui'
import { JSBI } from '@uniswap/sdk'
import { NavLink as RouterLink } from 'react-router-dom'
import { StyledIcon } from 'components/styled-icon'
import StakingModal from 'components/stake/StakingModalUnlock'
import UnstakingModal from 'components/stake/UnstakingModalUnlock'
import ClaimRewardModal from 'components/stake/ClaimRewardModalUnlock'
import { useActiveWeb3React } from 'hooks'
import { useStakingInfoUnlock } from 'state/stake/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import { currencyId } from 'utils/currencyId'
import { useWalletModalToggle } from 'state/application/hooks'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { usePair } from 'data/Reserves'
import { useCurrency } from 'hooks/Tokens'
import DoubleCurrencyLogo from 'components/DoubleLogo'

export default function StakeLpRow({
  currencyIdA,
  currencyIdB,
  apr,
  lockTime
}: {
  currencyIdA: string
  currencyIdB: string
  apr: number,
  lockTime: string
}) {
  const { account, chainId } = useActiveWeb3React()

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  const [currencyA, currencyB] = [useCurrency(currencyIdA), useCurrency(currencyIdB)]
  const tokenA = wrappedCurrency(currencyA ?? undefined, chainId)
  const tokenB = wrappedCurrency(currencyB ?? undefined, chainId)

  const [, stakingTokenPair] = usePair(tokenA, tokenB)
  const stakingInfo = useStakingInfoUnlock(stakingTokenPair)?.[0]

  const userLiquidityUnstaked = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.token)

  const toggleWalletModal = useWalletModalToggle()

  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleWalletModal()
    }
  }, [account, toggleWalletModal])

  return (
    <>
      <StakingModal
        isOpen={showStakingModal}
        onDismiss={() => setShowStakingModal(false)}
        stakingInfo={stakingInfo}
        userLiquidityUnstaked={userLiquidityUnstaked}
      />
      <UnstakingModal
        isOpen={showUnstakingModal}
        onDismiss={() => setShowUnstakingModal(false)}
        stakingInfo={stakingInfo}
      />
      <ClaimRewardModal
        isOpen={showClaimRewardModal}
        onDismiss={() => setShowClaimRewardModal(false)}
        stakingInfo={stakingInfo}
      />
      <Disclosure as="tbody" className="bg-white dark:bg-zinc-800">
        {({ open }) => (
          <>
            <tr className="bg-white dark:bg-zinc-800">
              <td className="px-6 py-4 w-1/2 text-sm whitespace-nowrap">
                <div className="flex flex-wrap items-center flex-1 sm:flex-nowrap">
                  <div className="flex -space-x-2 shrink-0">
                    <DoubleCurrencyLogo
                      currency0={currencyA ? currencyA : undefined}
                      currency1={currencyB ? currencyB : undefined}
                      size={24}
                      margin={true}
                    />
                  </div>
                  <p className="mt-2 sm:mt-0 sm:ml-4">
                    <span className="block text-gray-500 dark:text-zinc-400">
                      <Tooltip
                        className="z-10"
                        shouldWrapChildren={true}
                        label={`${currencyA?.symbol} / ${currencyB?.symbol}`}
                      >
                        ScarySwap
                        <br />
                        {currencyA?.symbol}-{currencyB?.symbol}
                      </Tooltip>
                    </span>
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{apr}%</td>
              <td className="px-6 py-4 text-sm text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{lockTime}</td>

              <td className="px-6 py-4 w-1/2 whitespace-nowrap dark:text-white">
                <Tooltip className="z-10" shouldWrapChildren={false} label={`Staked LP Amount`}>
                  <div className="flex items-center">
                    <p className="font-semibold">
                      {stakingInfo?.stakedAmount && Number(stakingInfo?.stakedAmount?.toFixed(18)) > 0 ? stakingInfo?.stakedAmount?.toFixed(5) : '0.00'}{' '}
                      <span className="text-sm font-normal">ScarySwap</span>
                    </p>
                    <StyledIcon as="InformationCircleIcon" size={5} className="inline ml-2 text-gray-400" />
                  </div>
                </Tooltip>
              </td>
              <td className="px-6 py-4 w-1/2 font-semibold whitespace-nowrap dark:text-white">
                {stakingInfo?.earnedAmount && Number(stakingInfo?.earnedAmount?.toFixed(18)) > 0 ? stakingInfo?.earnedAmount?.toFixed(5) : '0.00'}{' '}
                <span className="text-sm font-normal">PUMPKIN</span>
              </td>
              <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                <Disclosure.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                  <span>Actions</span>
                  <StyledIcon
                    as="ChevronUpIcon"
                    size={5}
                    className={`${open ? '' : 'transform rotate-180 transition ease-in-out duration-300'} ml-2`}
                  />
                </Disclosure.Button>
              </td>
            </tr>
            <Disclosure.Panel as="tr" className="bg-gray-50 dark:bg-zinc-700">
              <td className="px-6 py-4 w-1/2 text-sm whitespace-nowrap">
                <RouterLink
                  to={`/add/${currencyA && currencyId(currencyA)}/${currencyB && currencyId(currencyB)}`}
                  className={`inline-flex items-center px-4 py-2 text-sm leading-4 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${false
                    ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  {false ? `Add LP` : `Get LP`}
                </RouterLink>
              </td>
              <td className="px-6 py-4 w-1/2 text-sm whitespace-nowrap" />
              <td className="px-6 py-4 w-1/2 text-sm whitespace-nowrap">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 text-sm leading-4 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={!stakingInfo}
                  onClick={handleDepositClick}
                >
                  Stake LP
                </button>
              </td>
              <td className="px-6 py-4 w-1/2 text-sm whitespace-nowrap">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 text-sm leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={!stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))}
                  onClick={() => setShowUnstakingModal(true)}
                >
                  Unstake LP
                </button>
              </td>
              <td className="px-6 py-4 w-1/2 text-sm whitespace-nowrap">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 text-sm leading-4 text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={!stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))}
                  onClick={() => setShowClaimRewardModal(true)}
                >
                  Claim
                </button>
              </td>
              <td></td>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  )
}
