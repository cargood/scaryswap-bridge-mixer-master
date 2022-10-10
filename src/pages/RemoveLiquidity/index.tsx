import React, { useCallback, useContext, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { currencyEquals, ETHER, Percent, WETH } from '@uniswap/sdk'
import { Plus } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import { Tooltip } from '@blockstack/ui'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from 'components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MinimalPositionCard } from 'components/PositionCard'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { Dots } from 'components/swap/styleds'
import { StyledIcon } from 'components/styled-icon'
import SettingsTab from 'components/Settings'
import { ROUTER_ADDRESS } from '../../constants'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { usePairContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useApproveCallback, ApprovalState } from 'hooks/useApproveCallback'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useBurnActionHandlers } from 'state/burn/hooks'
import { useDerivedBurnInfo, useBurnState } from 'state/burn/hooks'
import { Field } from 'state/burn/actions'
import { useWalletModalToggle } from 'state/application/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'
import { wrappedCurrency } from 'utils/wrappedCurrency'

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const [tokenA, tokenB] = useMemo(
    () => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)],
    [currencyA, currencyB, chainId]
  )

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
        ? '<1'
        : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], ROUTER_ADDRESS)

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      return approveCallback()
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]
    const domain = {
      name: 'ScarySwap',
      version: '1',
      chainId: chainId,
      verifyingContract: pair.liquidityToken.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
    const message = {
      owner: account,
      spender: ROUTER_ADDRESS,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber(),
    }

    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then((signature) => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber(),
        })
      })
      .catch((error) => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback()
        }
      })
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null)
      return _onUserInput(field, typedValue)
    },
    [_onUserInput]
  )

  // tx sending
  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const router = getRouterContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB === ETHER
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity

    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString(),
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadline.toHexString(),
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((error) => {
            console.error(`estimateGas failed`, methodName, args, error)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      // const methodName = methodNames[0]
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Remove ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencyA?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencyB?.symbol,
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
            label: [currencyA?.symbol, currencyB?.symbol].join('/'),
          })
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500} className="text-gray-500 dark:text-white">
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'24px'} />
            <Text
              fontSize={24}
              fontWeight={500}
              style={{ marginLeft: '10px' }}
              className="text-gray-500 dark:text-white"
            >
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.text2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500} className="text-gray-500 dark:text-white">
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'24px'} />
            <Text
              fontSize={24}
              fontWeight={500}
              style={{ marginLeft: '10px' }}
              className="text-gray-500 dark:text-white"
            >
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage / 100
            }% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color={theme.text2} fontWeight={500} fontSize={16}>
            {'UNI ' + currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
            <Text fontWeight={500} fontSize={16} className="text-gray-500 dark:text-white">
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        {pair && (
          <>
            <RowBetween>
              <Text color={theme.text2} fontWeight={500} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )}
        <button
          type="button"
          disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
          onClick={onRemove}
          className={`${!(approval === ApprovalState.APPROVED || signatureData !== null)
              ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
              : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            } w-full inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-lg rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          Confirm
        </button>
      </>
    )
  }

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${currencyA?.symbol
    } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencyB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )

  const oneCurrencyIsWETH = Boolean(
    chainId &&
    ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
      (currencyB && currencyEquals(WETH[chainId], currencyB)))
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  )

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash ? txHash : ''}
        content={() => (
          <ConfirmationModalContent
            title={'You will receive'}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
            bottomContent={modalBottom}
          />
        )}
        pendingText={pendingText}
      />
      <main className="relative flex flex-col items-center justify-center flex-1 py-12 pb-8">
        <p className="w-full max-w-lg mb-2">
          <NavLink className="" to={`/pool`} exact>
            <span className="p-1.5 rounded-md inline-flex items-center">
              <StyledIcon as="ArrowLeftIcon" size={4} className="mr-2 text-gray-500 group-hover:text-gray-900" />
              <span className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100">
                Back to pool overview
              </span>
            </span>
          </NavLink>
        </p>
        <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow dark:bg-zinc-800">
          <div className="flex flex-col p-4">
            <div className="flex justify-between mb-4">
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-medium leading-6 text-gray-900 font-headings dark:text-zinc-50">
                    Liquidity
                  </h2>
                  <SettingsTab />
                </div>
                <p className="inline-flex items-center mt-1 text-sm text-gray-600 dark:text-zinc-400">
                  Remove liquidity to burn LP tokens and take out your rewards
                  <Tooltip
                    className="z-10"
                    shouldWrapChildren={true}
                    label={`By removing liquidity, you take out assets you provided and will stop earning on each trade.`}
                  >
                    <StyledIcon as="InformationCircleIcon" size={5} className="block mr-2 text-gray-400" />
                  </Tooltip>
                </p>
              </div>
            </div>
            <div className="group p-0.5 rounded-lg flex w-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-300 dark:hover:bg-zinc-200">
              <NavLink
                className="flex items-center justify-center flex-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100"
                to={`/add/${currencyIdA}/${currencyIdB}`}
                exact
              >
                <span className="p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md inline-flex items-center text-sm font-medium">
                  <StyledIcon
                    as="PlusCircleIcon"
                    size={4}
                    className="mr-2 text-gray-500 dark:text-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-900"
                  />
                  <span className="text-gray-600 dark:text-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-800">
                    Add
                  </span>
                </span>
              </NavLink>

              <button
                type="button"
                className="ml-0.5 p-1.5 lg:pl-2.5 lg:pr-3.5 rounded-md flex items-center justify-center flex-1 text-sm text-gray-600 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-offset-gray-100 bg-white ring-1 ring-black ring-opacity-5"
              >
                <StyledIcon as="MinusCircleIcon" size={4} className="mr-2 text-indigo-500" />
                <span className="text-gray-900">Remove</span>
              </button>
            </div>

            {pair ? (
              <div className="mt-4 w-full">
                <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
              </div>
            ) : null}

            <div className="mt-4">
              <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
                <div className="flex items-center p-4">
                  <div className="md:flex md:items-start md:flex-1 md:justify-between">
                    <label
                      htmlFor="removeLiquidityAmount"
                      className="block mr-4 text-base text-gray-700 dark:text-zinc-200 shrink-0"
                    >
                      Amount to remove
                    </label>
                    <div className="flex flex-col">
                      <div className="relative rounded-md">
                        <input
                          type="number"
                          inputMode="decimal"
                          autoFocus={true}
                          autoComplete="off"
                          autoCorrect="off"
                          name="removeLiquidityAmount"
                          id="removeLiquidityAmount"
                          pattern="^[0-9]$"
                          placeholder="0"
                          value={innerLiquidityPercentage}
                          onChange={(e: any) => setInnerLiquidityPercentage(Number(e.target.value).toFixed(0))}
                          className="block p-0 pr-4 m-0 text-3xl font-semibold text-right text-gray-700 truncate border-0 focus:outline-none focus:ring-0 bg-gray-50 dark:bg-zinc-900 dark:text-zinc-200 w-52"
                          style={{ appearance: 'textfield' }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-end pb-1 pointer-events-none text-gray-600 dark:text-zinc-400">
                          %
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <button
                          type="button"
                          className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                          onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                          onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                          onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          className="p-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                          onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center my-3">
                <StyledIcon as="ArrowDownIcon" size={6} className="text-gray-500" />
              </div>

              <div className="border border-gray-200 rounded-md shadow-sm bg-gray-50 hover:border-gray-300 focus-within:border-indigo-200 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-900 dark:focus-within:border-indigo-200">
                <div className="p-4">
                  <p className="text-base text-gray-700 dark:text-zinc-200">You will receive</p>

                  <dl className="mt-4 space-y-2">
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="text-lg font-medium">
                        <div className="flex items-center">
                          <div className="w-8 h-8 shrink-0">
                            <CurrencyLogo currency={currencyA} size="32px" />
                          </div>
                          <div className="ml-4">
                            <div className="text-base text-gray-900 dark:text-zinc-50">{currencyA?.symbol}</div>
                          </div>
                        </div>
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-700 sm:mt-0 sm:justify-end sm:inline-flex dark:text-zinc-200">
                        {formattedAmounts[Field.CURRENCY_A] || '-'}
                      </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                      <dt className="text-lg font-medium">
                        <div className="flex items-center">
                          <div className="w-8 h-8 shrink-0">
                            <CurrencyLogo currency={currencyB} size="32px" />
                          </div>
                          <div className="ml-4">
                            <div className="text-base text-gray-900 dark:text-zinc-50">{currencyB?.symbol}</div>
                          </div>
                        </div>
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-700 sm:mt-0 sm:justify-end sm:inline-flex dark:text-zinc-200">
                        {formattedAmounts[Field.CURRENCY_B] || '-'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {pair && (
                <div className="mt-4 lg:flex lg:items-start lg:justify-between">
                  <h4 className="text-xs font-normal text-gray-700 uppercase dark:text-zinc-100 font-headings">
                    Price
                  </h4>
                  <div className="mt-3 sm:mt-0 space-y-0.5 lg:text-right text-sm text-gray-500 dark:text-zinc-400">
                    <p>
                      1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                    </p>
                    <p>
                      1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 lg:flex lg:items-center lg:flex-1 lg:space-x-2">
                {!account ? (
                  <button
                    type="button"
                    onClick={toggleWalletModal}
                    className={`bg-indigo-600 hover:bg-indigo-700 cursor-pointer w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <RowBetween>
                    <button
                      type="button"
                      disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                      onClick={onAttemptToApprove}
                      className={`${approval !== ApprovalState.NOT_APPROVED || signatureData !== null
                          ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                        } w-[48%] inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {approval === ApprovalState.PENDING ? (
                        <Dots>Approving</Dots>
                      ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                        'Approved'
                      ) : (
                        'Approve'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                      onClick={() => {
                        setShowConfirm(true)
                      }}
                      className={`${!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)
                          ? 'bg-indigo-400 hover:bg-indigo-400 dark:text-indigo-600 cursor-not-allowed dark:bg-indigo-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                        } w-[48%] inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm font-medium text-xl rounded-md text-white hover:bg-indigo-700 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {error || 'Remove'}
                    </button>
                  </RowBetween>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
