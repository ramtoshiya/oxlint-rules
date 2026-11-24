import { readFileSync } from "node:fs";

declare const load: () => Promise<string>;
declare const log: (message: string) => void;
declare const fallback: string;

export const logsThenFallsBack = load().catch((error) => {
  log(String(error));
  return null;
});

export const rethrows = load().catch((error) => {
  throw new Error("load failed", { cause: error });
});

export const handlerFunction = load().catch(log);

export const computedValue = load().catch(() => fallback);

export const describesTheError = load().catch((error: unknown) => ({ ok: false, problem: String(error) }));

export const successHandlerOnly = load().then(() => null);

export const thenFirstArgument = load().then(() => "copied", log);

export const catchOnAnotherShape = { catch: () => null };

export function onlyExpectedError(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function logsAndContinues(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    log(String(error));
    return null;
  }
}

export function returnsTheError(file: string): string | Error {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    return error as Error;
  }
}

export function computedReturn(file: string): number {
  try {
    return readFileSync(file).length;
  } catch {
    return fallback.length;
  }
}

export function finallyOnly(file: string): void {
  try {
    readFileSync(file);
  } finally {
    log("done");
  }
}
