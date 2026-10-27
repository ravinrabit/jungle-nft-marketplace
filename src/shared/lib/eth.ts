import Big from 'big.js'

const EthDecimal = Big()
EthDecimal.DP = 18
EthDecimal.RM = EthDecimal.roundHalfEven
EthDecimal.NE = -21
EthDecimal.PE = 40

export const ETH_DECIMAL_PATTERN = /^(0|[1-9]\d*)(\.\d{1,18})?$/

const MIN_DISPLAY_FRACTION_DIGITS = 2

export function isEthAmount(value: string) {
  return ETH_DECIMAL_PATTERN.test(value)
}

function toDecimal(value: string) {
  return new EthDecimal(value)
}

function toCanonical(value: Big) {
  return value.toFixed()
}

export function sumEth(values: readonly string[]) {
  return toCanonical(values.reduce((total, value) => total.plus(toDecimal(value)), toDecimal('0')))
}

export function subtractEth(minuend: string, subtrahend: string) {
  return toCanonical(toDecimal(minuend).minus(toDecimal(subtrahend)))
}

export function multiplyEth(amount: string, factor: number | string) {
  return toCanonical(toDecimal(amount).times(factor))
}

export function roundEth(amount: string, fractionDigits: number) {
  return toCanonical(toDecimal(amount).round(fractionDigits, EthDecimal.roundHalfUp))
}

export function compareEth(left: string, right: string) {
  return toDecimal(left).cmp(toDecimal(right))
}

export function isZeroEth(amount: string) {
  return toDecimal(amount).eq(0)
}

export function formatEthValue(amount: string) {
  const decimal = toDecimal(amount)
  const fractionDigits = Math.max(MIN_DISPLAY_FRACTION_DIGITS, decimalPlaces(decimal))
  return decimal.toFixed(fractionDigits)
}

export function formatEth(amount: string) {
  return `${formatEthValue(amount)} ETH`
}

function decimalPlaces(value: Big) {
  const [, fraction = ''] = value.toFixed().split('.')
  return fraction.length
}
