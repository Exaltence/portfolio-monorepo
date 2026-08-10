'use strict';

const { existsSync, readdirSync, readFileSync, writeFileSync } = require('fs');
const { join, basename } = require('path');
// Not a direct dependency: reused from jsdom's own XML parser
const { SaxesParser } = require('saxes');

const ICON_DIRECTORY = join(
  __dirname,
  '..',
  '..',
  '..',
  'apps',
  'portfolio',
  'public',
  'img',
  'icons',
);
const SPRITE_NAME = 'sprite.svg';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const DROPPED_ATTRIBUTES = new Set(['xmlns', 'width', 'height', 'id']);

function readAttributes(openTag) {
  const attributes = [];
  const pattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;

  while ((match = pattern.exec(openTag)) !== null) {
    const value = match[2] !== undefined ? match[2] : match[3];

    if (!DROPPED_ATTRIBUTES.has(match[1])) {
      attributes.push(`${match[1]}="${value.replace(/"/g, '&quot;')}"`);
    }
  }

  return attributes;
}

function toSymbol(name, markup) {
  const open = markup.match(/<svg\b([^>]*)>/);
  const close = markup.lastIndexOf('</svg>');

  if (open === null || close === -1) {
    throw new Error(`${name}.svg is not a well-formed svg document`);
  }

  const attributes = readAttributes(open[1]);
  const children = markup.slice(open.index + open[0].length, close).trim();

  if (!attributes.some((attribute) => attribute.startsWith('viewBox='))) {
    throw new Error(
      `${name}.svg has no viewBox, so it cannot scale in a sprite`,
    );
  }

  return `  <symbol id="${name}" ${attributes.join(' ')}>${children}</symbol>`;
}

function assertParseable(sprite, names) {
  const parser = new SaxesParser();
  const symbolIds = new Set();
  let parseError = null;

  parser.on('error', (error) => {
    parseError = error;
  });
  parser.on('opentag', (node) => {
    if (node.name === 'symbol' && node.attributes.id) {
      symbolIds.add(String(node.attributes.id));
    }
  });
  parser.write(sprite).close();

  if (parseError) {
    throw new Error(
      `Generated sprite is not well-formed XML: ${parseError.message}`,
    );
  }

  for (const name of names) {
    if (!symbolIds.has(name)) {
      throw new Error(`Generated sprite is missing a symbol for "${name}"`);
    }
  }
}

function build() {
  const names = readdirSync(ICON_DIRECTORY)
    .filter((file) => file.endsWith('.svg') && file !== SPRITE_NAME)
    .map((file) => basename(file, '.svg'))
    .sort();

  if (names.length === 0) {
    throw new Error(`No icons found in ${ICON_DIRECTORY}`);
  }

  const symbols = names.map((name) =>
    toSymbol(name, readFileSync(join(ICON_DIRECTORY, `${name}.svg`), 'utf8')),
  );

  const sprite = `<svg xmlns="${SVG_NAMESPACE}">\n${symbols.join('\n')}\n</svg>\n`;

  assertParseable(sprite, names);

  return { sprite, count: names.length };
}

// `core.autocrlf` rewrites the checked-out file, compare content rather than raw bytes
function normalize(value) {
  return value.replace(/\r\n/g, '\n');
}

function main() {
  const { sprite, count } = build();
  const target = join(ICON_DIRECTORY, SPRITE_NAME);

  if (!process.argv.includes('--check')) {
    writeFileSync(target, sprite, 'utf8');
    console.log(
      `Generated ${SPRITE_NAME} from ${count} icons (${Buffer.byteLength(sprite, 'utf8')} bytes).`,
    );
    return;
  }

  const current = existsSync(target) ? readFileSync(target, 'utf8') : null;

  if (current === null || normalize(current) !== normalize(sprite)) {
    throw new Error(
      `${SPRITE_NAME} is out of date. Run \`npm run icon-sprite\` and commit the result.`,
    );
  }

  console.log(`${SPRITE_NAME} is up to date (${count} icons).`);
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
