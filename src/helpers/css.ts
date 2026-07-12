// Extract every class name that appears in a *selector* position of a CSS
// stylesheet. Used for both Bootstrap and Bootstrap Icons, so it must stay
// library-agnostic.
export function extractClasses(content: string): Array<string> {
  const classes: Set<string> = new Set();
  const classRegex = /\.(-?[a-zA-Z_][\w-]*)/g;

  // Depth of *declaration* blocks we're inside. Property values live here and
  // can contain dots (e.g. `.5rem` or SVG data URIs), so they must be skipped.
  // At-rule blocks (@media/@supports/@keyframes) are not counted, so their
  // nested selectors are still scanned.
  let skipDepth = 0;
  let selector = '';

  for (const char of content) {
    if (char === '{') {
      const isAtRule = selector.trimStart().startsWith('@');

      if (skipDepth === 0 && !isAtRule) {
        let match: RegExpExecArray | null;
        while ((match = classRegex.exec(selector)) !== null) {
          classes.add(match[1]);
        }
        skipDepth = 1;
      } else if (skipDepth > 0) {
        skipDepth++;
      }

      selector = '';
    } else if (char === '}') {
      if (skipDepth > 0) {
        skipDepth--;
      }

      selector = '';
    } else if (skipDepth === 0) {
      selector += char;
    }
  }

  return Array.from(classes);
}
