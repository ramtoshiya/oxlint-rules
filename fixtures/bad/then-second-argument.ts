declare const copy: () => Promise<void>;
declare const done: () => void;

export const status = copy().then(() => "copied", () => "failed"); // reported
export const silent = copy().then(done, () => {}); // reported
export const empty = copy().then(done, () => ({})); // reported
