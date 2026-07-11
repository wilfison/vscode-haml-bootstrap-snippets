import { CompletionItem, CompletionItemProvider, Position, TextDocument } from "vscode";
import Bootstrap from "./bootstrap";

// Matches either a HAML class shorthand chain (%tag/#id/.class with no spaces,
// e.g. `%div.card.`) or a class attribute value (`class: "btn `). Anchoring the
// dot branch to an element chain avoids firing on prose or Ruby like `foo.bar`.
const CLASS_REGEX = /(?:^|\s)(?:%[\w-]+|#[\w-]+)?(?:\.[\w-]*)+$|class["']?\s*[:=>]+\s*["']?[\w\s:-]*$/

class CompletionProvider implements CompletionItemProvider {
  public bootstrap: Bootstrap;

  constructor(bootstrap: Bootstrap) {
    this.bootstrap = bootstrap;
  }

  public provideCompletionItems(document: TextDocument, position: Position, _token: any, _context: any): CompletionItem[] | undefined {
    const { shouldComplete, lastWord } = this.matchCompletion(document, position);

    if (!shouldComplete) {
      return undefined;
    }

    let classList = this.bootstrap.classList;

    if (lastWord) {
      classList = this.bootstrap.classList
        .filter((className) => className.startsWith(lastWord));
    }

    const completionItems = classList.map((className) => {
      const completionItem = new CompletionItem(className);
      completionItem.kind = 9;

      return completionItem;
    });

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
