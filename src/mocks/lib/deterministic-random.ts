export type RandomSource = () => number

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = state
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function randomInteger(random: RandomSource, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min
}

export function randomHex(random: RandomSource, length: number) {
  return Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join('')
}
