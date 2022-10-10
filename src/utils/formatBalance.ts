export const displayNumber = (number: number) => {
  if (number > 100000000) {
    return number.toPrecision(4)
  } else {
    return number.toFixed(2)
  }
}

export default null
