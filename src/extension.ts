import * as vscode from "vscode";

import CompletionProvider from "./completion_provider";
import Bootstrap from "./bootstrap";
import SnippetsCompletion from "./snippets_completion";

export function activate(context: vscode.ExtensionContext) {
  const schemaFile = { language: 'haml', scheme: 'file' };

  const bootstrap = new Bootstrap();
  const supportedVersions = ['4', '5'];

  supportedVersions.forEach((version) => {
    if (['latest', version].includes(bootstrap.majorVersion)) {
      const disposable = vscode.languages.registerCompletionItemProvider(
        schemaFile,
        new SnippetsCompletion(version),
      );

      context.subscriptions.push(disposable);
    }
  });

  let cssClassProvider: vscode.Disposable | undefined;

  const syncCssClassCompletion = () => {
    const enabled = vscode.workspace
      .getConfiguration('hamlBootstrap')
      .get('enableCssClassCompletion');

    if (enabled && !cssClassProvider) {
      bootstrap.load().catch((error) => {
        console.error(`Failed to load Bootstrap classes: ${error}`);
      });

      cssClassProvider = vscode.languages.registerCompletionItemProvider(
        schemaFile,
        new CompletionProvider(bootstrap),
        '.',
        '"',
        "'",
      );

      context.subscriptions.push(cssClassProvider);
    } else if (!enabled && cssClassProvider) {
      cssClassProvider.dispose();
      cssClassProvider = undefined;
    }
  };

  syncCssClassCompletion();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('hamlBootstrap.enableCssClassCompletion')) {
        syncCssClassCompletion();
      }
    }),
  );
}

export function deactivate() { }
