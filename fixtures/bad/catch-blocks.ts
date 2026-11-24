import { readFileSync } from "node:fs";

export function emptyCatch(file: string): void {
  try {
    readFileSync(file);
  } catch {} // reported
}

export function emptyCatchWithBinding(file: string): void {
  try {
    readFileSync(file);
  } catch (error) {} // reported
}

export function returnsNull(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch { // reported
    return null;
  }
}

export function returnsEmptyArray(file: string): string[] {
  try {
    return readFileSync(file, "utf8").split("\n");
  } catch (error) { // reported
    return [];
  }
}

export function returnsDefaultObject(file: string): object {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch { // reported
    return {};
  }
}

export function returnsBoolean(file: string): boolean {
  try {
    readFileSync(file);
    return true;
  } catch { // reported
    return false;
  }
}

export function withFinally(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8");
  } catch { // reported
    return undefined;
  } finally {
    console.log("done");
  }
}
