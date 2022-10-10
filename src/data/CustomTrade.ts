import { Route, CurrencyAmount, TradeType, Price, ETHER, currencyEquals, Percent, TokenAmount } from '@uniswap/sdk'
import invariant from 'tiny-invariant'
import { wrappedCurrencyAmount } from 'utils/wrappedCurrency'

export class CustomTrade {
  readonly route: Route
  readonly tradeType: TradeType
  readonly inputAmount: CurrencyAmount
  readonly outputAmount: CurrencyAmount
  readonly executionPrice: Price
  readonly nextMidPrice: Price
  readonly priceImpact: Percent

  constructor(route: Route, amount: CurrencyAmount, customAmountData: TokenAmount, tradeType: TradeType) {
    const amounts = new Array(route.path.length)
    const nextPairs = new Array(route.pairs.length)

    if (tradeType === TradeType.EXACT_INPUT) {
      !currencyEquals(amount.currency, route.input) ? invariant(false, 'INPUT') : void 0
      amounts[0] = wrappedCurrencyAmount(amount, route.chainId)

      const pair = route.pairs[0]

      const _pair$getOutputAmount = pair.getOutputAmount(amounts[0])
      // outputAmount = _pair$getOutputAmount[0],
      const nextPair = _pair$getOutputAmount[1]

      amounts[1] = customAmountData
      nextPairs[0] = nextPair
    } else {
      !currencyEquals(amount.currency, route.output) ? invariant(false, 'OUTPUT') : void 0
      amounts[1] = wrappedCurrencyAmount(amount, route.chainId)

      const _pair = route.pairs[0]

      const _pair$getInputAmount = _pair.getInputAmount(amounts[1])
      // inputAmount = _pair$getInputAmount[0],
      const _nextPair = _pair$getInputAmount[1]

      amounts[0] = customAmountData
      nextPairs[0] = _nextPair
    }

    this.route = route
    this.tradeType = tradeType
    this.inputAmount =
      tradeType === TradeType.EXACT_INPUT
        ? amount
        : route.input === ETHER
        ? CurrencyAmount.ether(amounts[0].raw)
        : amounts[0]
    this.outputAmount =
      tradeType === TradeType.EXACT_OUTPUT
        ? amount
        : route.output === ETHER
        ? CurrencyAmount.ether(amounts[1].raw)
        : amounts[1]
    this.executionPrice = new Price(
      this.inputAmount.currency,
      this.outputAmount.currency,
      this.inputAmount.raw,
      this.outputAmount.raw
    )
    this.nextMidPrice = Price.fromRoute(new Route(nextPairs, route.input))
    this.priceImpact = this.computePriceImpact(route.midPrice, this.inputAmount, this.outputAmount)
  }

  computePriceImpact(midPrice: Price, inputAmount: CurrencyAmount, outputAmount: CurrencyAmount) {
    const exactQuote = midPrice.raw.multiply(inputAmount.raw) // calculate slippage := (exactQuote - outputAmount) / exactQuote

    const slippage = exactQuote.subtract(outputAmount.raw).divide(exactQuote)
    return new Percent(slippage.numerator, slippage.denominator)
  }
}
