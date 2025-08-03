export function isParsableNumber(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

export function isEmpty(obj: object): boolean {
  for (const _ in obj) return false;
  return true;
}