import path from "node:path";
import { readFileSync } from "node:fs";
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Position,
  SnippetString,
  TextDocument,
} from "vscode";

interface SnippetDefinition {
  prefix: string;
  body: string[];
}

type SnippetMap = Record<string, SnippetDefinition>;

class SnippetsCompletion implements CompletionItemProvider {
  private version: string;
  private snippets: SnippetMap;

  constructor(version: string) {
    this.version = version;
    this.snippets = this.loadSnippets();
  }

  public provideCompletionItems(
    _document: TextDocument,
    _position: Position,
    _token: CancellationToken,
    _context: CompletionContext,
  ): CompletionItem[] {
    return Object.keys(this.snippets).map((key) => {
      const definition = this.snippets[key];
      const snippet = new CompletionItem(definition.prefix, CompletionItemKind.Snippet);
      snippet.insertText = new SnippetString(definition.body.join('\n'));
      snippet.detail = key;

      return snippet;
    });
  }

  private loadSnippets(): SnippetMap {
    const file = path.resolve(__dirname, `../snippets/bootstrap${this.version}.code-snippets`);
    const content = readFileSync(file, 'utf8');

    return JSON.parse(content) as SnippetMap;
  }
}

export default SnippetsCompletion;
