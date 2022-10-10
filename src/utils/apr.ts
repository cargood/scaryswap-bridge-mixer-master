import { FTM_PER_YEAR } from '../constants'

export const getApr = (poolWeight: number, ftmPriceUsd: number, poolLiquidityUsd: number): number => {
  let ftmRewardsAprAsNumber = 0
  if (poolLiquidityUsd) {
    const yearlyCakeRewardAllocation = poolWeight * FTM_PER_YEAR
    const ftmRewardsApr = (yearlyCakeRewardAllocation * ftmPriceUsd * 100) / poolLiquidityUsd
    ftmRewardsAprAsNumber = ftmRewardsApr
  }
  return ftmRewardsAprAsNumber
}

export default null
