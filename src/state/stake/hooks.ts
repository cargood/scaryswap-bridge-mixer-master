import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, Pair, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { Interface } from '@ethersproject/abi'
import { DAI, USDC, BNB, ETH } from '../../constants'
import STAKE_ABI from '../../constants/abis/stake.json'
import LP_STAKE_ABI from '../../constants/abis/lpstake.json'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'

export const STAKING_GENESIS = 1600387200

export const REWARDS_DURATION_DAYS = 60

const STAKING_REWARDS_INTERFACE = new Interface(STAKE_ABI)
const LP_STAKING_REWARDS_INTERFACE = new Interface(LP_STAKE_ABI)

const rewardToken = DAI

const STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.FANTOM]: [
    {
      tokens: [WETH[ChainId.FANTOM], USDC],
      stakingRewardAddress: '0xfa8347ee968dbe74a3aefa254cdec76437c219a0'
    },
    {
      tokens: [BNB, USDC],
      stakingRewardAddress: '0x5E39C15bbC55B04D2fcDAd2De05fC73d76d91549'
    },
    {
      tokens: [ETH, USDC],
      stakingRewardAddress: '0x64AB1cdf4C96aF35Afc90914f358D874fBeE0dA5'
    }
  ]
}
const STAKING_REWARDS_INFO_UNLOCK: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.FANTOM]: [
    {
      tokens: [WETH[ChainId.FANTOM], USDC],
      stakingRewardAddress: '0x9015c46148b0b3518e747185537ce6e830440e0c'
    }
  ]
}

export const SINGLE_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    token: Token
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.FANTOM]: [
    {
      token: DAI,
      stakingRewardAddress: '0x263a6dd1c3116347e7d4a89aefc73c6db5d90576'
    },
    {
      token: WETH[ChainId.FANTOM],
      stakingRewardAddress: '0x0fb15655b5da947d0a0b393d89545faea1c08f43'
    }
  ]
}

export interface StakingInfo {
  // the address of the reward contract
  // stakedStatus: boolean
  stakingRewardAddress: string
  tokens: [Token, Token]
  stakedAmount: TokenAmount
  earnedAmount: TokenAmount
  totalStakedAmount: TokenAmount
  periodFinish: Date | undefined
  active: boolean
}

export interface SingleStakingInfo {
  // the address of the reward contract
  stakedStatus: boolean
  stakingRewardAddress: string
  token: Token
  stakedAmount: TokenAmount
  earnedAmount: TokenAmount
  totalStakedAmount: TokenAmount
  periodFinish: Date | undefined
  active: boolean
}

export function useStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { account, chainId } = useActiveWeb3React()
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
          pairToFilterBy === undefined
            ? true
            : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
              pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
        ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])
  const accountArg = useMemo(() => [account ?? undefined], [account])

  // const staked = useMultipleContractSingleData(rewardsAddresses, LP_STAKING_REWARDS_INTERFACE, 'Staked', accountArg)
  const stakedTokens = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'StakedTokens',
    accountArg
  )
  // const calculateReward = [{ error: false, result: undefined, loading: false }]
  const calculateReward = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'CalculateReward',
    accountArg
  )
  const lockingPeriod = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'LockingPeriod',
    undefined,
    NEVER_RELOAD
  )
  const totalStaked = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalStaked')

  return useMemo(() => {
    if (!chainId) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      // const stakedState = staked[index]
      const balanceState = stakedTokens[index]
      const calculateRewardState = calculateReward[index]
      const totalSupplyState = totalStaked[index]
      // these get fetched regardless of account
      const lockingPeriodState = lockingPeriod[index]

      if (
        // these may be undefined if not logged in
        // !stakedState?.loading &&
        !balanceState?.loading &&
        !calculateRewardState?.loading &&
        totalSupplyState &&
        !totalSupplyState.loading &&
        // always need these
        lockingPeriodState &&
        !lockingPeriodState.loading
      ) {
        if (
          // stakedState?.error ||
          balanceState?.error ||
          calculateRewardState?.error ||
          lockingPeriodState.error ||
          totalSupplyState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the LP token
        const tokens = info[index].tokens
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'))

        // check for account, if no account set to 0

        // const stakedStatus = stakedState?.result?.[0]
        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))

        const lockingPeriodSeconds = lockingPeriodState.result?.[0]?.toNumber()
        const lockingPeriodMs = lockingPeriodSeconds * 1000

        // compare period end timestamp vs current block timestamp (in seconds)
        const active =
          lockingPeriodSeconds && currentBlockTimestamp ? lockingPeriodSeconds > currentBlockTimestamp.toNumber() : true

        memo.push({
          // stakedStatus: stakedStatus ?? false,
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          periodFinish: lockingPeriodMs > 0 ? new Date(lockingPeriodMs) : undefined,
          earnedAmount: new TokenAmount(rewardToken, JSBI.BigInt(calculateRewardState?.result?.[0] ?? 0)),
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          active
        })
      }
      return memo
    }, [])
  }, [
    // staked,
    calculateReward,
    chainId,
    currentBlockTimestamp,
    stakedTokens,
    info,
    lockingPeriod,
    rewardsAddresses,
    totalStaked
  ])
}
export function useStakingInfoUnlock(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { account, chainId } = useActiveWeb3React()
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO_UNLOCK[chainId]?.filter(stakingRewardInfo =>
          pairToFilterBy === undefined
            ? true
            : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
              pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
        ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])
  const accountArg = useMemo(() => [account ?? undefined], [account])

  // const staked = useMultipleContractSingleData(rewardsAddresses, LP_STAKING_REWARDS_INTERFACE, 'Staked', accountArg)
  const stakedTokens = useMultipleContractSingleData(
    rewardsAddresses,
    LP_STAKING_REWARDS_INTERFACE,
    'TokensStaked',
    accountArg
  )
  // const calculateReward = [{ error: false, result: undefined, loading: false }]
  const calculateReward = useMultipleContractSingleData(
    rewardsAddresses,
    LP_STAKING_REWARDS_INTERFACE,
    'CheckRewards',
    accountArg
  )
  const lockingPeriod = useMultipleContractSingleData(
    rewardsAddresses,
    LP_STAKING_REWARDS_INTERFACE,
    'TimeStaked',
    accountArg
  )
  const totalStaked = useMultipleContractSingleData(rewardsAddresses, LP_STAKING_REWARDS_INTERFACE, 'totalStaked')

  return useMemo(() => {
    if (!chainId) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      // const stakedState = staked[index]
      const balanceState = stakedTokens[index]
      const calculateRewardState = calculateReward[index]
      const totalSupplyState = totalStaked[index]
      // these get fetched regardless of account
      const lockingPeriodState = lockingPeriod[index]

      if (
        // these may be undefined if not logged in
        // !stakedState?.loading &&
        !balanceState?.loading &&
        !calculateRewardState?.loading &&
        totalSupplyState &&
        !totalSupplyState.loading &&
        // always need these
        lockingPeriodState &&
        !lockingPeriodState.loading
      ) {
        if (
          // stakedState?.error ||
          balanceState?.error ||
          calculateRewardState?.error ||
          lockingPeriodState.error ||
          totalSupplyState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the LP token
        const tokens = info[index].tokens
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'))

        // check for account, if no account set to 0

        // const stakedStatus = stakedState?.result?.[0]
        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))

        const lockingPeriodSeconds = lockingPeriodState.result?.[0]?.toNumber()
        const lockingPeriodMs = lockingPeriodSeconds * 1000

        // compare period end timestamp vs current block timestamp (in seconds)
        const active =
          lockingPeriodSeconds && currentBlockTimestamp ? lockingPeriodSeconds > currentBlockTimestamp.toNumber() : true

        memo.push({
          // stakedStatus: stakedStatus ?? false,
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          periodFinish: lockingPeriodMs > 0 ? new Date(lockingPeriodMs) : undefined,
          earnedAmount: new TokenAmount(rewardToken, JSBI.BigInt(calculateRewardState?.result?.[0] ?? 0)),
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          active
        })
      }
      return memo
    }, [])
  }, [
    // staked,
    calculateReward,
    chainId,
    currentBlockTimestamp,
    stakedTokens,
    info,
    lockingPeriod,
    rewardsAddresses,
    totalStaked
  ])
}

export function useSingleStakingInfo(tokenToFilterBy?: Token | null): SingleStakingInfo[] {
  const { account, chainId } = useActiveWeb3React()
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useMemo(
    () =>
      chainId
        ? SINGLE_STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
          tokenToFilterBy === undefined
            ? true
            : tokenToFilterBy === null
              ? false
              : tokenToFilterBy === stakingRewardInfo.token
        ) ?? []
        : [],
    [chainId, tokenToFilterBy]
  )

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])
  const accountArg = useMemo(() => [account ?? undefined], [account])

  const staked = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'Staked', accountArg)

  const stakedTokens = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'StakedTokens',
    accountArg
  )

  // const calculateReward = [{ error: false, result: undefined, loading: false }]
  const calculateReward = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'CalculateReward',
    accountArg
  )
  const lockingPeriod = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'LockingPeriod',
    undefined,
    NEVER_RELOAD
  )
  const totalStaked = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalStaked')

  return useMemo(() => {
    if (!chainId) return []

    return rewardsAddresses.reduce<SingleStakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const stakedState = staked[index]
      const balanceState = stakedTokens[index]
      const calculateRewardState = calculateReward[index]
      const totalSupplyState = totalStaked[index]
      // these get fetched regardless of account
      const lockingPeriodState = lockingPeriod[index]

      if (
        // these may be undefined if not logged in
        !stakedState?.loading &&
        !balanceState?.loading &&
        !calculateRewardState?.loading &&
        totalSupplyState &&
        !totalSupplyState.loading &&
        // always need these
        lockingPeriodState &&
        !lockingPeriodState.loading
      ) {
        if (
          stakedState?.error ||
          balanceState?.error ||
          calculateRewardState?.error ||
          lockingPeriodState.error ||
          totalSupplyState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // check for account, if no account set to 0

        const stakedStatus = stakedState?.result?.[0]
        const stakedAmount = new TokenAmount(info[index].token, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(info[index].token, JSBI.BigInt(totalSupplyState.result?.[0]))

        // const lockingPeriodSeconds = lockingPeriodState.result?.[0]?.toNumber()
        const lockingPeriodSeconds = Number(lockingPeriodState.result?.[0])
        const lockingPeriodMs = lockingPeriodSeconds * 1000

        // compare period end timestamp vs current block timestamp (in seconds)
        const active =
          lockingPeriodSeconds && currentBlockTimestamp ? lockingPeriodSeconds > currentBlockTimestamp.toNumber() : true

        memo.push({
          stakedStatus: stakedStatus ?? false,
          stakingRewardAddress: rewardsAddress,
          token: info[index].token,
          periodFinish: lockingPeriodMs > 0 ? new Date(lockingPeriodMs) : undefined,
          earnedAmount: new TokenAmount(rewardToken, JSBI.BigInt(calculateRewardState?.result?.[0] ?? 0)),
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          active
        })
      }
      return memo
    }, [])
  }, [
    staked,
    calculateReward,
    chainId,
    currentBlockTimestamp,
    stakedTokens,
    info,
    lockingPeriod,
    rewardsAddresses,
    totalStaked
  ])
}

export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | CurrencyAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}
