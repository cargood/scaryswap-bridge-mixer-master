import { Disclosure, Menu, Transition } from '@headlessui/react'
import React, { Fragment, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Moon, Sun } from 'react-feather'
import axios from 'axios'
import Web3Status from '../Web3Status'
import { useDarkModeManager } from 'state/user/hooks'
import { useActiveWeb3React } from 'hooks'
import Logo from 'assets/images/nova.png'
import { MenuIcon } from '@heroicons/react/solid'
import { Contract } from '@ethersproject/contracts'
import { ethers } from 'ethers'
import ERC20_ABI from '../../constants/abis/erc20.json'
import PumpkinImage from 'assets/images/pumpkin.png'

export const simpleRpcProvider = new ethers.providers.JsonRpcProvider('https://rpc3.fantom.network')

export default function Header() {
  const { library, chainId } = useActiveWeb3React()

  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const [pumpkinPrice, setPrice] = useState<number>(0)

  const ftmContract = new Contract(
    '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    ERC20_ABI,
    chainId === 250 ? library : simpleRpcProvider
  )
  const pumpkinContract = new Contract(
    '0xad522217e64ec347601015797dd39050a2a69694',
    ERC20_ABI,
    chainId === 250 ? library : simpleRpcProvider
  )

  useEffect(() => {
    ; (async () => {
      try {
        const ftmBalanceOfLp = await ftmContract.balanceOf('0xa73d251d37040ade6e3eff71207901621c9c867a')
        const pumpkinBalanceOfLp = await pumpkinContract.balanceOf('0xa73d251d37040ade6e3eff71207901621c9c867a')

        const priceOfCoinInFtm =
          ftmBalanceOfLp && pumpkinBalanceOfLp
            ? Number(ftmBalanceOfLp?.toString()) / Number(pumpkinBalanceOfLp?.toString())
            : 0

        const { data } = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-fantom&vs_currencies=usd'
        )
        const priceOfOneCoin = priceOfCoinInFtm * data['wrapped-fantom'].usd

        setPrice(priceOfOneCoin)
      } catch (error) {
        console.log(error)
      }
    })()
  }, [ftmContract, pumpkinContract])
  return (
    <Disclosure as="nav" className="fixed top-0 z-10 bg-white shadow dark:shadow-gray-700 dark:bg-zinc-900 w-full">
      {() => (
        <div className="px-6 mx-auto max-w-7xl lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex justify-between flex-1">
              <NavLink className="flex items-center shrink-0 w-12" to="/">
                <img src={Logo} alt="" width="100%" />
              </NavLink>

              <div className="ml-2 space-x-4 flex">
                <NavLink
                  to="/swap"
                  className="hidden sm:inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent dark:text-zinc-100 hover:border-gray-300 hover:text-gray-700"
                  activeClassName="border-indigo-500 text-gray-900"
                >
                  Swap
                </NavLink>

                <NavLink
                  to="/pool"
                  className="hidden sm:inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent dark:text-zinc-100 hover:border-gray-300 hover:text-gray-700"
                  activeClassName="border-indigo-500 text-gray-900"
                >
                  Pool
                </NavLink>
                <NavLink
                  to="/stake"
                  className="hidden sm:inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent dark:text-zinc-100 hover:border-gray-300 hover:text-gray-700"
                  activeClassName="border-indigo-500 text-gray-900"
                >
                  Stake
                </NavLink>
                <a
                  href="https://www.spaghetti.cash"
                  className="hidden sm:inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent dark:text-zinc-100 hover:border-gray-300 hover:text-gray-700"
                >
                  mixer
                </a>
                <NavLink
                  to="/mint"
                  className="hidden sm:inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent dark:text-zinc-100 hover:border-gray-300 hover:text-gray-700"
                  activeClassName="border-indigo-500 text-gray-900"
                >
                  Mint
                </NavLink>

                <NavLink
                  to="/Bridge"
                  className="hidden sm:inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent dark:text-zinc-100 hover:border-gray-300 hover:text-gray-700"
                  activeClassName="border-indigo-500 text-gray-900"
                >
                  Bridge
                </NavLink>
                
                <div className="flex items-center">
                  <Web3Status />

                  <Menu as="div" className="relative flex items-center justify-end sm:hidden">
                    {({ open }) => (
                      <>
                        <Menu.Button className="inline-flex items-center justify-center px-2 py-1 text-sm text-indigo-500 bg-white rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 dark:bg-zinc-800 dark:text-indigo-400">
                          <MenuIcon className="w-6 h-6" />
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
                            className="absolute top-4 z-10 w-24 mx-3 mt-6 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg dark:divide-gray-600 ring-1 ring-black ring-opacity-5 focus:outline-none"
                          >
                            <div className="px-1 py-1">
                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <NavLink
                                    to="/swap"
                                    className={`${active
                                        ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                        : 'text-gray-900'
                                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  >
                                    Swap
                                  </NavLink>
                                )}
                              </Menu.Item>

                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <NavLink
                                    to="/pool"
                                    className={`${active
                                        ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                        : 'text-gray-900'
                                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  >
                                    Pool
                                  </NavLink>
                                )}
                              </Menu.Item>

                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <NavLink
                                    to="/stake"
                                    className={`${active
                                        ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                        : 'text-gray-900'
                                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  >
                                    Stake
                                  </NavLink>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <NavLink
                                    to="/mint"
                                    className={`${active
                                        ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                        : 'text-gray-900'
                                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  >
                                    Mint
                                  </NavLink>
                                )}
                              </Menu.Item>

                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <NavLink
                                    to='/bridge'
                                    className={`${active
                                        ? 'bg-indigo-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                                        : 'text-gray-900'
                                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  >
                                    Bridge
                                  </NavLink>
                                )}
                              </Menu.Item>

                            </div>
                          </Menu.Items>
                        </Transition>
                      </>
                    )}
                  </Menu>

                  <div className="sm:ml-2">
                    <a
                      href="https://dexscreener.com/fantom/0xa73d251d37040ade6e3eff71207901621c9c867a"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center"
                    >
                      <img src={PumpkinImage} alt="" width={20} className="mr-1" />
                      <span className="text-black dark:text-white">{pumpkinPrice.toFixed(3)}</span>
                    </a>
                  </div>
                  <button onClick={() => toggleDarkMode()} className="ml-4 flex">
                    {darkMode ? <Moon size={20} color="#fff" /> : <Sun size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Disclosure>
  )
}
