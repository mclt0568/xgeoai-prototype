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