import * as assert from 'assert';

import { extractClasses } from '../helpers/css';

suite('extractClasses', () => {
  test('extracts class names from selectors', () => {
    const css = '.btn { color: red; } .btn-primary, .alert { color: blue; }';
    const classes = extractClasses(css);

    assert.ok(classes.includes('btn'));
    assert.ok(classes.includes('btn-primary'));
    assert.ok(classes.includes('alert'));
  });

  test('ignores dots inside declaration blocks', () => {
    // `.5rem` and the data URI dots live in property values and must not leak in.
    const css = '.spacer { margin: .5rem; background: url(data:image/svg+xml;base64,ab.cd); }';
    const classes = extractClasses(css);

    assert.deepStrictEqual(classes, ['spacer']);
  });

  test('scans selectors nested inside at-rules', () => {
    const css = '@media (min-width: 768px) { .col-md-6 { width: 50%; } }';
    const classes = extractClasses(css);

    assert.ok(classes.includes('col-md-6'));
  });

  test('extracts bootstrap-icons bi-* classes and skips attribute selectors', () => {
    const css =
      '@font-face{font-family:bootstrap-icons;src:url("fonts/bootstrap-icons.woff2") format("woff2")}' +
      '.bi::before,[class^=bi-]::before,[class*=" bi-"]::before{font-family:bootstrap-icons!important}' +
      '.bi-alarm-fill::before{content:"\\f101"}.bi-alarm::before{content:"\\f102"}';
    const classes = extractClasses(css);

    assert.ok(classes.includes('bi'));
    assert.ok(classes.includes('bi-alarm-fill'));
    assert.ok(classes.includes('bi-alarm'));
    // The `[class^=bi-]`/`[class*=" bi-"]` attribute selectors must not add a
    // bare `class` (or `woff2` from the @font-face src) entry.
    assert.ok(!classes.includes('class'));
    assert.ok(!classes.includes('woff2'));
  });
});
