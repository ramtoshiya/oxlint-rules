declare const load: () => Promise<string>;
declare const save: (text: string) => Promise<void>;

export const arrowNull = load().catch(() => null); // reported
export const arrowUndefined = load().catch(() => undefined); // reported
export const arrowEmptyObject = load().catch(() => ({})); // reported
export const arrowEmptyArray = load().catch(() => []); // reported
export const arrowString = load().catch(() => "unknown"); // reported
export const arrowFalse = load().catch((error) => false); // reported
export const arrowNegative = load().catch(() => -1); // reported
export const emptyBody = save("x").catch(() => {}); // reported
export const emptyFunction = save("x").catch(function () {}); // reported
export const returnsConstant = load().catch(() => { // reported
  return null;
});
export const bareReturn = load().catch(() => { // reported
  return;
});
export const voidZero = load().catch(() => void 0); // reported

export async function inAwait() {
  const text = await load().catch(() => null); // reported
  return text;
}

export const chained = load()
  .then((text) => text.trim())
  .catch(() => ""); // reported

export const optional = (load as undefined | typeof load)?.().catch(() => null); // reported
