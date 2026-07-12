# Change Log

All notable changes to the extension will be documented in this file.

## [1.1.0]

- Feature: Detect Bootstrap across all folders in a multi-root workspace.
- Feature: Toggle CSS class completion on config change without reloading the window.
- Fix: Register the `haml` language so completion works when no other HAML extension is installed.
- Fix: Reject empty/corrupt class caches instead of serving them for pinned versions.
- Fix: Handle network failures when fetching Bootstrap classes from the CDN.
- Fix: Expire the `latest` class cache so newly released Bootstrap classes surface.
- Fix: Extract all class names from compiled CSS, not only those after a closing brace.
- Fix: Stop class completion from firing inside prose and Ruby code.
- Fix: Keep hyphenated class names when filtering completions.

## [1.0.5]

- Feature: Implement class autocomplete.
- Feature: Implement dynamic snippet completion.

## [1.0.2]

- Simplify bootstrap 4 snippets
