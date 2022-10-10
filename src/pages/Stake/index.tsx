import React from 'react'
import StakeLpRow from './components/stake-lp-row'
import StakeLpRowUnlock from './components/stake-lp-row-unlock'
import StakeDaiSection from './components/stake-dai-section'
import StakeWFTMSection from './components/stake-wftm-section'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'

export default function Stake() {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-zinc-900">
      <div className="md:px-4 mx-auto max-w-7xl lg:px-8">
        <main className="relative flex-1 py-8">
          <StakeDaiSection />
          <StakeWFTMSection />
          <section className="relative mt-8 overflow-hidden">
            <header className="pb-5 border-b border-gray-200 dark:border-zinc-600">
              <h3 className="text-lg leading-6 text-gray-900 font-headings dark:text-zinc-50">
                Zero fees pairs liquidity pools
              </h3>
              <p className="max-w-3xl mt-2 text-sm text-gray-500 dark:text-zinc-300">
                Earn PUMPKIN by providing liquidity to our zero fees pairs , you can use the PUMPKIN you earn with over
                10 Defi platforms. <br />
                Happy farming
              </p>
            </header>

            {account ? (
              <div className="flex flex-col mt-4">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-zinc-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-600">
                        <thead className="bg-gray-50 dark:bg-zinc-800 dark:bg-opacity-80">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 w-1/5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              LP Token
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 w-1/5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Current APR
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 w-1/5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Lock Time
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 w-1/5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Staked
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 w-1/5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Rewards
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 w-1/5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-zinc-400"
                            >
                              Actions
                            </th>
                            <th></th>
                          </tr>
                        </thead>

                        <StakeLpRow
                          currencyIdA="0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"
                          currencyIdB="0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
                          apr={1464}
                          lockTime={"7 days"}
                        />
                        <StakeLpRowUnlock
                          currencyIdA="0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"
                          currencyIdB="0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
                          apr={406}
                          lockTime={"0 days"}
                        />
                        {/* <StakeLpRow
                          currencyIdA="0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454"
                          currencyIdB="0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
                          apr={970.24}
                        />
                        <StakeLpRow
                          currencyIdA="0x74b23882a30290451A17c44f4F05243b6b58C76d"
                          currencyIdB="0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
                          apr={638.25}
                        /> */}
                      </table>

                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="inline-flex items-center justify-center w-full px-4 py-3 mt-4 text-xl font-medium text-center text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={toggleWalletModal}
              >
                Connect Wallet
              </button>
            )}
            <p className="mt-4 text-sm text-gray-500 dark:text-zinc-300">
              here is the full list of project that accept PUMPKIN as a utility token : <a style={{ color: "blue" }} href={"https://www.pumpkin.financial/our-projects"}>https://www.pumpkin.financial/our-projects</a>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
