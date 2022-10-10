import React from 'react'
import { NavLink } from 'react-router-dom'
import Settings from '../Settings'

export default function SwapPoolHeader({ tab }: { tab: string }) {
  const tabs = [
    { name: 'Swap', href: '/swap', current: tab === 'swap' },
    { name: 'Pool', href: '/pool', current: tab === 'pool' },
  ]
  return (
    <div className="flex justify-between mb-4">
      <nav className="flex space-x-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.href}
            className={`${
              tab.current
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-50'
            } px-3 py-2 text-lg font-headings rounded-md transition ease-out duration-200`}
            aria-current={tab.current ? 'page' : undefined}
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>
      {tab === 'swap' && <Settings />}
      {tab === 'pool' && (
        <NavLink
          to="/add/ETH"
          className="bg-indigo-600 hover:bg-indigo-700 inline-flex items-center justify-center text-center px-2 py-2 border border-transparent shadow-sm font-medium rounded-md text-white focus:outline-none"
        >
          Add Liquidity
        </NavLink>
      )}
    </div>
  )
}
