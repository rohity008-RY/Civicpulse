const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const root = resolve(__dirname, '../..');

function readExport(file, name) {
  const source = readFileSync(resolve(root, file), 'utf8').replaceAll('export ', '');
  return vm.runInNewContext(`${source};${name}`);
}

test('every citizen screen key has explicit copy in all ten languages', () => {
  const dictionaries = readExport('frontend/src/components/citizen/copy.js', 'citizenDictionaries');
  assert.equal(Object.keys(dictionaries).length, 10);
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    for (const key of Object.keys(dictionaries.en)) assert.ok(typeof dictionary[key] === 'string' && dictionary[key].trim(), `${language}.${key}`);
  }
});

test('web and Android share complete matching onboarding translations', () => {
  const webSource = readFileSync(resolve(root, 'frontend/src/utils/onboardingCopy.js'), 'utf8');
  assert.equal(webSource, readFileSync(resolve(root, 'mobile/src/utils/onboardingCopy.js'), 'utf8'));
  const dictionaries = readExport('frontend/src/utils/onboardingCopy.js', 'onboardingCopy');
  assert.equal(Object.keys(dictionaries).length, 10);
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    for (const key of Object.keys(dictionaries.en)) assert.ok(typeof dictionary[key] === 'string' && dictionary[key].trim(), `${language}.${key}`);
  }
});

test('relative report dates follow the selected language and reject invalid dates', () => {
  const timeAgo = readExport('frontend/src/utils/date.js', 'timeAgo');
  assert.equal(timeAgo('not-a-date', 'hi'), '');
  assert.equal(timeAgo(null, 'en'), '');
  const date = new Date(Date.now() - 2 * 86400000).toISOString();
  assert.notEqual(timeAgo(date, 'hi'), timeAgo(date, 'en'));
  assert.notEqual(timeAgo(date, 'ta'), timeAgo(date, 'en'));
});
