/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ESLint } from 'eslint';
import sonarjs from 'eslint-plugin-sonarjs';

const PRIMARY_AREAS = [
  'packages/ai-chat/',
  'packages/ai-chat-components/',
  'packages/typedoc-theme/',
  'examples/',
];

const SOURCE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const requireFrom = createRequire(import.meta.url);
const parser = requireFrom.resolve('@typescript-eslint/parser');

// `filePath` is what decides JSX: without it the parser reads the source as
// `.ts` and rejects the first `<`.
export function parse(content, filePath) {
  return requireFrom(parser).parse(content, { filePath, jsx: true, loc: true, range: true });
}

export function labelsFor(rel) {
  const r = rel.replaceAll('\\', '/');
  if (PRIMARY_AREAS.some((p) => r.startsWith(p))) {
    return { important: 'Important', blocker: 'Blocker' };
  }
  if (r.startsWith('demo/')) {
    return { important: 'Nit', blocker: 'Important' };
  }
  return null;
}

export function toRepoRelative(f) {
  return relative(process.cwd(), resolve(f)).replaceAll('\\', '/');
}

// A real PR's `git diff -U0` runs to megabytes, and spawnSync's default 1 MB
// buffer kills git with an empty stderr, which reads as a clean gate failure.
function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: Infinity });
  if (result.status !== 0) {
    console.error(result.stderr.trim());
    process.exit(1);
  }
  return result.stdout;
}

export function changedPaths(base) {
  const out = git(['diff', '--name-only', '--diff-filter=d', `${base}...HEAD`]);
  return out.split('\n').filter(Boolean);
}

export function changedFiles(base) {
  return changedPaths(base).filter((f) => SOURCE_FILE.test(f));
}

export function newCodeFiles(base) {
  const out = git(['diff', '--name-status', '--diff-filter=A', `${base}...HEAD`]);
  return out
    .split('\n')
    .map((l) => l.split('\t')[1])
    .filter((f) => f !== undefined && SOURCE_FILE.test(f));
}

// `git diff -U0` names each file in a `+++ b/<path>` header before its added
// lines, so one pass carries the file along with the line. The diff is not
// restricted by pathspec: dropping the rename source unpairs a move, and git
// then re-reports every line of a moved file as added.
export function addedLines(base) {
  const rows = [];
  let file = null;
  let line = 0;
  for (const raw of git(['diff', '-U0', `${base}...HEAD`]).split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw.startsWith('+++ b/') ? raw.slice(6) : null;
    } else if (/^@@ -\d+(,\d+)? \+(\d+)/.test(raw)) {
      line = Number(raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)/)[1]);
    } else if (raw.startsWith('+') && file !== null && SOURCE_FILE.test(file)) {
      rows.push({ file, text: raw.slice(1), line });
      line += 1;
    }
  }
  return rows;
}

// Normalising drops what a copy would not carry across: layout, punctuation
// lines, comments, imports, and a bare `return`.
const NOISE = /^([{}()\]]+;?|return;?)$|^(import|export)\s|^(\/\/|\/\*|\*)/;

export function normalise(rows) {
  return rows
    .map((r) => ({ ...r, text: r.text.trim().replace(/\s+/g, ' ') }))
    .filter((r) => r.text !== '' && !NOISE.test(r.text));
}

export const WINDOW = 6;

// Every WINDOW-line window, hashed, so an added run can be looked up in one pass.
export function windows(rows) {
  const out = [];
  for (let i = 0; i + WINDOW <= rows.length; i++) {
    const text = rows.slice(i, i + WINDOW).map((r) => r.text).join('\n');
    out.push({ index: i, line: rows[i].line, key: createHash('md5').update(text).digest('hex') });
  }
  return out;
}

export function contentAt(base, file) {
  const result = spawnSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout : null;
}

function firstFatal(messages) {
  return messages.find((m) => m.fatal || (m.ruleId == null && m.severity === 2));
}

export function makeLinter(rules) {
  const eslint = new ESLint({
    useEslintrc: false,
    allowInlineConfig: false,
    plugins: { sonarjs },
    baseConfig: {
      plugins: ['sonarjs'],
      parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules,
    },
  });
  return async (content, filePath) => {
    const [result] = await eslint.lintText(content, { filePath });
    const messages = result?.messages ?? [];
    const fatal = firstFatal(messages);
    if (fatal) throw new Error(fatal.message);
    return messages;
  };
}

function fail(message, usage) {
  console.error(`error: ${message}`);
  console.error(usage);
  process.exit(2);
}

function parseInts(values, ints, defaults, usage) {
  const out = {};
  for (const name of ints) {
    const raw = values[name];
    if (raw !== undefined && !/^\d+$/.test(raw)) {
      fail(`--${name} requires a non-negative integer`, usage);
    }
    out[name] = raw === undefined ? (defaults[name] ?? null) : Number(raw);
  }
  return out;
}

export function parseCli({ ints, defaults = {}, usage }) {
  const options = { changed: { type: 'string' } };
  for (const name of ints) options[name] = { type: 'string' };
  let parsed;
  try {
    parsed = parseArgs({ options, allowPositionals: true });
  } catch (e) {
    fail(e.message, usage);
  }
  const { values, positionals } = parsed;
  const files = positionals.map(toRepoRelative);
  const changed = values.changed ?? null;
  if (files.length > 0 && changed !== null) {
    fail('positional files and --changed are mutually exclusive', usage);
  }
  if (files.length === 0 && changed === null) {
    console.error(usage);
    process.exit(2);
  }
  return { files, changed, ...parseInts(values, ints, defaults, usage) };
}
