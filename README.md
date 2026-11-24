# oxlint-rules

Lint rules for mistakes that coding agents repeat across repositories, written as an [oxlint](https://oxc.rs) JS plugin. A mistake becomes a rule here once it has shown up in more than one repository. The lint message is the documentation an agent reads, so each message says what is wrong, why it matters, where the correct pattern lives, and how to fix it.

The plugin is plain JavaScript with no runtime dependencies and uses the ESLint v9 rule API. oxlint's JS plugin support is alpha, so the repository pins oxlint to an exact version and the tests run the real binary.

## Rules

### ramtoshiya/no-error-to-constant

Reports a failure path that throws the error away and produces a constant instead:

```ts
const text = await readText(file).catch(() => null);           // .catch
const ok = await copy().then(() => "copied", () => "failed");  // .then rejection handler
try { return JSON.parse(raw); } catch { return {}; }           // catch block
try { await save(); } catch {}                                 // empty catch block
```

A constant is a literal, `undefined`, `[]`, or `{}`. A handler that logs, rethrows, inspects the error, or computes its value is not reported.

Why it matters: the caller cannot tell "the file does not exist" from "the disk failed" or "this code has a bug". The failure also never reaches a log, so nobody learns about it.

The correct pattern handles the one error the code expects and lets everything else surface:

```ts
const text = await readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
  if (error.code === "ENOENT") return null;
  throw error;
});
```

When the code only wants to carry on after any failure, log the error at least once and return the constant:

```ts
const text = await readText(file).catch((error) => {
  console.error(`could not read ${file}`, error);
  return null;
});
```

Some best-effort calls are legitimate, such as closing a window that may already be gone. Record those sites in the suppressions file (below) instead of rewriting them.

## Use it in a repository

Pin the repository by commit SHA and add oxlint at an exact version. Install both as dev dependencies:

```sh
npm install --save-exact --save-dev oxlint@1.94.0 github:ramtoshiya/oxlint-rules#<commit sha>
```

Extend the base config in `.oxlintrc.json`:

```json
{
  "extends": ["./node_modules/@ramtoshiya/oxlint-rules/base.json"]
}
```

`base.json` loads the plugin relative to itself, so the repository needs no `jsPlugins` entry of its own. Run `oxlint`; any finding exits with status 1.

### Baseline for an existing repository

Record the current violations once, commit the file, and fail only on new ones:

```sh
npx oxlint --suppress-all   # writes oxlint-suppressions.json
npx oxlint                  # fails on violations that are not in the file
```

Fix a suppressed site and run `npx oxlint --prune-suppressions` to drop its entry.

## Develop

```sh
npm install
npm test
```

Every rule has fixtures in `fixtures/bad` and `fixtures/good`. A line that must be reported ends with `// reported`; `test/rules.test.js` runs oxlint and compares the reported lines with the markers. Add a bad fixture shaped like the real mistake and a good fixture for the legitimate neighbour before changing a rule.
