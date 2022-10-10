import React from 'react'
import { escapeRegExp } from 'utils'

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const Input = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  ...rest
}: {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      autoFocus={true}
      autoComplete="off"
      autoCorrect="off"
      pattern="^[0-9]*[.,]?[0-9]*$"
      placeholder="0.0"
      value={value}
      onChange={event => {
        enforcer(event.target.value.replace(/,/g, '.'))
      }}
      min={0}
      className="w-0 flex-1 p-0 m-0 ml-4 text-xl font-semibold text-right text-gray-800 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-50"
    />
  )
})

export default Input
