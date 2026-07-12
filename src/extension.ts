import * as vscode from "vscode";

import CompletionProvider from "./completion_provider";
import CssLibrary from "./css_library";
import Bootstrap from "./bootstrap";
import BootstrapIcons from "./bootstrap_icons";
import SnippetsCompletion from "./snippets_completion";

export function activate(context: vscode.ExtensionContext) {
  const schemaFile = { language: 'haml', scheme: 'file' };

  const bootstrap = new Bootstrap();
  const bootstrapIcons = new BootstrapIcons();
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

  // Register (or re-register) the CSS class completion provider from the current
  // settings. Rebuilt from scratch on every relevant config change so toggling
  // either setting takes effect without a reload.
  const rebuildCssClassCompletion = () => {
    cssClassProvider?.dispose();
    cssClassProvider = undefined;

    const config = vscode.workspace.getConfiguration('hamlBootstrap');

    if (!config.get('enableCssClassCompletion')) {
      return;
    }

    const libraries: CssLibrary[] = [bootstrap];
    bootstrap.load().catch((error) => {
      console.error(`Failed to load Bootstrap classes: ${error}`);
    });

    // Bootstrap Icons is optional: only offer `bi-*` classes when the package is
    // actually present in the workspace and the user hasn't opted out.
    if (config.get('enableBootstrapIconsCompletion') && bootstrapIcons.detected) {
      libraries.push(bootstrapIcons);
      bootstrapIcons.load().catch((error) => {
        console.error(`Failed to load Bootstrap Icons classes: ${error}`);
      });
    }

    cssClassProvider = vscode.languages.registerCompletionItemProvider(
      schemaFile,
      new CompletionProvider(libraries),
      '.',
      '"',
      "'",
    );

    context.subscriptions.push(cssClassProvider);
  };

  rebuildCssClassCompletion();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration('hamlBootstrap.enableCssClassCompletion') ||
        event.affectsConfiguration('hamlBootstrap.enableBootstrapIconsCompletion')
      ) {
        rebuildCssClassCompletion();
      }
    }),
  );
}

export function deactivate() { }
