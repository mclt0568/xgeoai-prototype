export function isParsableNumber(value: string): boolean {
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

// export function c(classes: {[key: string]: boolean}): string {
//   return Object.entries(classes).filter(c => c[1]).map(c => c[0]).join(" ");
// }