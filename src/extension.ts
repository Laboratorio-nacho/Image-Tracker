import * as vscode from 'vscode';
import { ImageScanner } from './imageScanner';
import { ImageTreeProvider } from './imageTreeProvider';

let scanner: ImageScanner;
let treeProvider: ImageTreeProvider;

export function activate(context: vscode.ExtensionContext) {
	scanner = new ImageScanner();
	treeProvider = new ImageTreeProvider();

	const treeView = vscode.window.createTreeView('imageTracker', {
		treeDataProvider: treeProvider
	});
	context.subscriptions.push(treeView);

	context.subscriptions.push(
		vscode.commands.registerCommand('image-tracker.refreshImages', async () => {
			const images = await scanner.scanImages();
			treeProvider.refresh(images);
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
		vscode.commands.executeCommand('image-tracker.refreshImages');
	});

	scanner.watch();
	vscode.commands.executeCommand('image-tracker.refreshImages');
}

export function deactivate() {
	scanner?.dispose();
}
