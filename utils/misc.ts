export function isParsableNumber(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

export function isEmpty(obj: object): boolean {
  for (const _ in obj) return false;
  return true;
}

export const isOfType = <T>(typeDef: readonly T[]) => (val: any): val is T => typeDef.includes(val);

export const max = <T>(vals: T[]): T | undefined => vals.length !== 0 ? vals.reduce((x, y) => x > y ? x : y) : undefined;
export const min = <T>(vals: T[]): T | undefined => vals.length !== 0 ? vals.reduce((x, y) => x > y ? y : x) : undefined;

export const isArrayEqual = <T>(x: T[], y: T[]) => x.length === y.length ? x.map((v, i) => v === y[i]).reduce((u, v) => u && v) : false;

export const inRange = (x0: number, x1: number, val: number) => (val >= x0) && (val <= x1);
export const inRangeRev = (x1: number, x0: number, val: number) => (val >= x0) && (val <= x1);
export const inRangeLoose = (x1: number, x0: number, val: number) => inRange(x0, x1, val) || inRangeRev(x0, x1, val);