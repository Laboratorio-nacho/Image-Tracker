import * as vscode from 'vscode';
import { ImageScanner } from './imageScanner';
import { ImageTreeProvider } from './imageTreeProvider';
import { ImageDecorationProvider } from './imageDecorationProvider';

let scanner: ImageScanner;
let treeProvider: ImageTreeProvider;
let decorationProvider: ImageDecorationProvider;
let refreshTimeout: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
	scanner = new ImageScanner();
	treeProvider = new ImageTreeProvider();
	decorationProvider = new ImageDecorationProvider(scanner);

	context.subscriptions.push(
		vscode.window.registerFileDecorationProvider(decorationProvider)
	);

	const treeView = vscode.window.createTreeView('imageTracker', {
		treeDataProvider: treeProvider
	});
	context.subscriptions.push(treeView);

	context.subscriptions.push(
		vscode.commands.registerCommand('image-tracker.refreshImages', async () => {
			try {
				const images = await scanner.scanImages();
				treeProvider.refresh(images);
			} catch {
				// scan cancelled
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('image-tracker.openImage', (uri: vscode.Uri) => {
			vscode.commands.executeCommand('vscode.open', uri);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('image-tracker.openReference', (ref: { file: vscode.Uri; line: number; column: number }) => {
			vscode.workspace.openTextDocument(ref.file).then(doc => {
				vscode.window.showTextDocument(doc, { selection: new vscode.Range(ref.line - 1, ref.column - 1, ref.line - 1, ref.column - 1) });
			});
		})
	);

	scanner.onDidChange(() => {
		if (refreshTimeout) {
			clearTimeout(refreshTimeout);
		}
		refreshTimeout = setTimeout(() => {
			vscode.commands.executeCommand('image-tracker.refreshImages');
		}, 500);
	});

	scanner.watch();
	vscode.commands.executeCommand('image-tracker.refreshImages');
}

export function deactivate() {
	scanner?.dispose();
	decorationProvider?.dispose();
}
