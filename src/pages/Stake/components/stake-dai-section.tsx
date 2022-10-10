import React, { Fragment, useState, useCallback } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { JSBI } from '@uniswap/sdk'
import { Tooltip } from '@blockstack/ui'
import { StyledIcon } from 'components/styled-icon'
import SingleStakingModal from 'components/stake/SingleStakingModal'
import SingleUnstakingModal from 'components/stake/SingleUnstakingModal'
import SingleClaimRewardModal from 'components/stake/SingleClaimRewardModal'
import { useActiveWeb3React } from 'hooks'
import { useSingleStakingInfo } from 'state/stake/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { DAI } from '../../../constants'
import { unwrappedToken } from 'utils/wrappedCurrency'
import CurrencyLogo from 'components/CurrencyLogo'

export default function StakeFtmSection() {
  const { account } = useActiveWeb3React()

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  const stakingInfo = useSingleStakingInfo(DAI)?.[0]

  const currency = unwrappedToken(DAI)

  const userLiquidityUnstaked = useCurrencyBalance(account ?? undefined, currency ?? undefined)

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
      <SingleStakingModal
        isOpen={showStakingModal}
        onDismiss={() => setShowStakingModal(false)}
        stakingInfo={stakingInfo}
        userLiquidityUnstaked={userLiquidityUnstaked}
      />
      <SingleUnstakingModal
        isOpen={showUnstakingModal}
        onDismiss={() => setShowUnstakingModal(false)}
        stakingInfo={stakingInfo}
      />
      <SingleClaimRewardModal
        isOpen={showClaimRewardModal}
        onDismiss={() => setShowClaimRewardModal(false)}
        stakingInfo={stakingInfo}
      />
      <section>
        <header className="pb-5 border-b border-gray-200 dark:border-zinc-600 sm:flex sm:justify-between sm:items-end">
          <div>
            <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">DAI</h3>
            <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-400">
              When staking DAI in the security module <span className="font-semibold">you will receive stDAI</span>{' '}
              which is a representation of your share of the pool. DAI in the pool is{' '}
              <span className="font-semibold">auto-compounding</span>. Your amount of stDAI{' '}
              <span className="font-semibold">does not change</span>, but the DAI value it represents{' '}
              <span className="font-semibold">will increase</span>. Both DAI and stDAI can be used to propose and vote
              in governance.
            </p>
          </div>
        </header>

        <div className="mt-4 bg-white divide-y divide-gray-200 rounded-md shadow dark:divide-gray-600 dark:bg-zinc-800">
          <div className="px-4 py-5 space-y-6 divide-y divide-gray-200 dark:divide-zinc-600 sm:p-6">
            <div className="md:grid md:grid-flow-col gap-4 sm:grid-cols-[min-content,auto]">
              <div className="self-center w-14">
                <CurrencyLogo currency={currency} size="48" />
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">stDAI</p>
                <div>
                  <p className="text-lg font-semibold dark:text-white">
                    {stakingInfo?.stakedAmount ? stakingInfo.stakedAmount.toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">DAI</p>
                <p className="text-lg font-semibold dark:text-white">
                  {userLiquidityUnstaked ? userLiquidityUnstaked.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">Current APR</p>
                <p className="text-indigo-600 dark:text-indigo-400">605%</p>
              </div>
              <div className="mt-3 md:mt-0">
                <p className="text-sm leading-6 text-gray-500 dark:text-zinc-400 md:mb-1">Lock Time</p>
                <p className="text-indigo-600 dark:text-indigo-400">3 days</p>
              </div>
              <div className="self-center">
                <Menu as="div" className="relative flex items-center justify-end">
                  {({ open }) => (
                    <>
                      <Menu.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                        <span>Actions</span>
                        <StyledIcon
                          as="ChevronUpIcon"
                          size={4}
                          className={`${open ? '' : 'transform rotate-180 transition ease-in-out duration-300'} ml-2`}
                        />
                      </Menu.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="absolute top-0 z-10 w-48 mx-3 mt-6 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg dark:divide-gray-600 right-3 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }: { active: boolean }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={false}
                                >
                                  {true ? (
                                    <Tooltip placement="left" className="mr-2 z-10" label={`You can stake DAI`}>
                                      <div className="flex items-center w-full" onClick={handleDepositClick}>
                                        <StyledIcon
                                          as="ArrowCircleDownIcon"
                                          size={5}
                                          className="block mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Stake
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon
                                        as="ArrowCircleDownIcon"
                                        size={5}
                                        className="block mr-3 text-gray-400"
                                      />
                                      Stake
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }: { active: boolean }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))}
                                >
                                  {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) ? (
                                    <Tooltip placement="left" className="mr-2 z-10" label={`You can unstake DAI`}>
                                      <div
                                        className="flex items-center w-full"
                                        onClick={() => setShowUnstakingModal(true)}
                                      >
                                        <StyledIcon
                                          as="ArrowCircleUpIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Unstake
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon as="ArrowCircleUpIcon" size={5} className="mr-3 text-gray-400" />
                                      Unstake
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }: { active: boolean }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                      : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  disabled={!stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))}
                                >
                                  {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) ? (
                                    <Tooltip placement="left" className="mr-2 z-10" label={`You can claim DAI`}>
                                      <div
                                        className="flex items-center w-full"
                                        onClick={() => setShowClaimRewardModal(true)}
                                      >
                                        <StyledIcon
                                          as="ClockIcon"
                                          size={5}
                                          className="mr-3 text-gray-400 group-hover:text-white"
                                        />
                                        Claim
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <>
                                      <StyledIcon as="ClockIcon" size={5} className="mr-3 text-gray-400" />
                                      Claim
                                    </>
                                  )}
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
