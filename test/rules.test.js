import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import plugin from "../plugin.js";

const root = path.resolve(import.meta.dirname, "..");
const fixtures = path.join(root, "fixtures");
const oxlint = path.join(root, "node_modules/.bin/oxlint");

function lint(directory) {
  const result = spawnSync(oxlint, ["-c", "oxlintrc.json", "--format", "json", directory], { cwd: fixtures, encoding: "utf8" });
  assert.ok(result.status === 0 || result.status === 1, `oxlint exited ${result.status}: ${result.stderr}`);
  const report = JSON.parse(result.stdout);
  const files = readdirSync(path.join(fixtures, directory)).filter((file) => file.endsWith(".ts"));
  assert.equal(report.number_of_files, files.length, `oxlint should lint every file in fixtures/${directory}`);
  return { files, diagnostics: report.diagnostics };
}

function markedLines(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, index) => (line.includes("// reported") ? [index + 1] : []));
}

for (const rule of Object.keys(plugin.rules)) {
  const code = `${plugin.meta.name}(${rule})`;
  const own = (diagnostics) => diagnostics.filter((diagnostic) => diagnostic.code === code);

  test(`${code} reports every marked line in fixtures/bad and nothing else`, () => {
    const { files, diagnostics } = lint("bad");
    for (const file of files) {
      const expected = markedLines(path.join(fixtures, "bad", file));
      assert.ok(expected.length > 0, `${file} has no "// reported" marker`);
      const found = own(diagnostics)
        .filter((diagnostic) => diagnostic.filename === `bad/${file}`)
        .map((diagnostic) => diagnostic.labels[0].span.line);
      assert.deepEqual(found.sort((a, b) => a - b), expected, file);
    }
  });

  test(`${code} stays silent on fixtures/good`, () => {
    const { diagnostics } = lint("good");
    assert.deepEqual(
      own(diagnostics).map((diagnostic) => `${diagnostic.filename}:${diagnostic.labels[0].span.line}`),
      [],
    );
  });

  test(`${code} message says what is wrong, why, where the pattern lives, and the fix`, () => {
    const { diagnostics } = lint("bad");
    const [first] = own(diagnostics);
    assert.ok(first, "no diagnostic to read");
    assert.match(first.message, /discards the error/);
    assert.match(first.message, /Why it matters: \S/);
    assert.match(first.message, /Where the pattern lives: https:\/\/github\.com\/ramtoshiya\/oxlint-rules#\S+/);
    assert.match(first.message, /Fix: \S/);
  });
}

test("base.json enables every rule of the plugin as an error", () => {
  const base = JSON.parse(readFileSync(path.join(root, "base.json"), "utf8"));
  assert.deepEqual(
    Object.keys(base.rules).sort(),
    Object.keys(plugin.rules).map((rule) => `${plugin.meta.name}/${rule}`).sort(),
  );
  assert.ok(Object.values(base.rules).every((level) => level === "error"));
});
