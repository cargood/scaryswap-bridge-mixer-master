import React from 'react'
import ComingSoonImage from 'assets/images/comingsoon.png'

export default function Mint() {
  return (
    <div className='flex flex-col justify-center items-center'>
      <img src={ComingSoonImage} alt="" />
      <h3 className="text-3xl font-bold text-black dark:text-white">Coming Soon</h3>
    </div>
  )
}
