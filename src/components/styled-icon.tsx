import React from 'react'
import * as HeroiconsSolid from '@heroicons/react/solid'
import * as HeroiconsOutline from '@heroicons/react/outline'

type IconName = keyof typeof HeroiconsSolid | keyof typeof HeroiconsOutline

interface IconProps {
  as: IconName
  className?: string
  size?: number
  solid?: boolean
}

const sizeMap: Record<number, string> = {
  3: 'w-3 h-3',
  4: 'w-4 h-4',
  5: 'w-5 h-5',
  6: 'w-6 h-6'
}

export const StyledIcon = ({ as, className, size = 4, solid = true }: IconProps) => {
  const Icon = solid ? HeroiconsSolid[as] : HeroiconsOutline[as]

  return <Icon aria-hidden="true" className={`flex-shrink-0 ${className} ${sizeMap[size]}`} />
}

StyledIcon.className = ''
