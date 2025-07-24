export function isParsableNumber(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}