import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("CSS drift check detects changes without modifying tracked output", () => {
  const output = new URL("../src/styles/theme.css", import.meta.url);
  const before = readFileSync(output);
  const dir = mkdtempSync(join(tmpdir(), "anzhiyu-css-test-"));
  const input = join(dir, "test.styl");
  try {
    writeFileSync(input, "body\n  color red\n");
    const result = spawnSync(process.execPath, ["scripts/compile-css.cjs", "--check"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, ANZHIYU_STYLUS_SRC: input }, encoding: "utf8",
    });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /out of date/);
    assert.deepEqual(readFileSync(output), before);
  } finally {
    // Only delete the exact temporary file we created; never recurse.
    unlinkSync(input);
    rmdirSync(dir);
  }
});
