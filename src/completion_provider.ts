import { CompletionItem, CompletionItemKind, CompletionItemProvider, Position, TextDocument } from "vscode";
import CssLibrary from "./css_library";

// Matches either a HAML class shorthand chain (%tag/#id/.class with no spaces,
// e.g. `%div.card.`) or a class attribute value (`class: "btn `). Anchoring the
// dot branch to an element chain avoids firing on prose or Ruby like `foo.bar`.
const CLASS_REGEX = /(?:^|\s)(?:%[\w-]+|#[\w-]+)?(?:\.[\w-]*)+$|class["']?\s*[:=>]+\s*["']?[\w\s:-]*$/

class CompletionProvider implements CompletionItemProvider {
  public libraries: CssLibrary[];

  constructor(libraries: CssLibrary[]) {
    this.libraries = libraries;
  }

  public provideCompletionItems(document: TextDocument, position: Position, _token: any, _context: any): CompletionItem[] | undefined {
    const { shouldComplete, lastWord } = this.matchCompletion(document, position);

    if (!shouldComplete) {
      return undefined;
    }

    const completionItems: CompletionItem[] = [];

    for (const library of this.libraries) {
      for (const className of library.classList) {
        if (lastWord && !className.startsWith(lastWord)) {
          continue;
        }

        const completionItem = new CompletionItem(className);
        completionItem.kind = CompletionItemKind.Property;
        completionItem.detail = library.name;

        completionItems.push(completionItem);
      }
    }

    return completionItems;
  }

  private matchCompletion(document: TextDocument, position: Position) {
    const lineContent = document.lineAt(position.line).text;
    const beforeCursor = lineContent.slice(0, position.character).trim();

    const matches = beforeCursor.match(CLASS_REGEX);
    if (!matches) {
      return { shouldComplete: false, lastWord: "" };
    }

    const match = matches[0];
    const lastWord = match.match(/[\w-]+$/);

    return { shouldComplete: true, lastWord: lastWord ? lastWord[0] : "" };
  }
}

export default CompletionProvider;
