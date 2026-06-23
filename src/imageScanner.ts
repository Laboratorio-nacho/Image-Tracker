import * as vscode from 'vscode';
import * as path from 'path';

export interface ImageReference {
	file: vscode.Uri;
	line: number;
	column: number;
}

export interface ImageItem {
	uri: vscode.Uri;
	references: ImageReference[];
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'tif'];

const IGNORE_PATTERNS = '**/{node_modules,.git,dist,out,.vscode-test}/**';

const REFERENCE_EXTENSIONS = '{md,html,ts,tsx,js,jsx,css,scss,less,vue,svelte,json,yml,yaml}';

export class ImageScanner {
	private disposables: vscode.Disposable[] = [];
	private fileWatcher: vscode.FileSystemWatcher | undefined;
	private _onDidChange = new vscode.EventEmitter<void>();
	readonly onDidChange = this._onDidChange.event;

	async scanImages(): Promise<ImageItem[]> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}

		const pattern = `**/*.{${IMAGE_EXTENSIONS.join(',')}}`;
		const imageUris = await vscode.workspace.findFiles(pattern, IGNORE_PATTERNS);

		const items: ImageItem[] = [];
		for (const uri of imageUris) {
			const references = await this.findReferences(uri);
			items.push({ uri, references });
		}

		return items;
	}

	private async findReferences(imageUri: vscode.Uri): Promise<ImageReference[]> {
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(imageUri);
		if (!workspaceFolder) {
			return [];
		}

		const relativePath = path.relative(workspaceFolder.uri.fsPath, imageUri.fsPath);
		const escapedPath = relativePath.replace(/\\/g, '/');
		const imageName = path.basename(escapedPath);

		const refs: ImageReference[] = [];
		const files = await vscode.workspace.findFiles(
			`**/*.${REFERENCE_EXTENSIONS}`,
			IGNORE_PATTERNS
		);

		for (const file of files) {
			if (file.fsPath === imageUri.fsPath) {
				continue;
			}

			try {
				const content = (await vscode.workspace.fs.readFile(file)).toString();
				const lines = content.split('\n');
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					let col = line.indexOf(escapedPath);
					if (col === -1) {
						col = line.indexOf(imageName);
					}
					if (col !== -1) {
						refs.push({ file, line: i + 1, column: col + 1 });
					}
				}
			} catch {
				// skip binary files
			}
		}

		return refs;
	}

	watch(): void {
		this.dispose();
		const imgPattern = `**/*.{${IMAGE_EXTENSIONS.join(',')}}`;
		const refPattern = `**/*.${REFERENCE_EXTENSIONS}`;
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(`{${imgPattern},${refPattern}}`);

		const fireChange = () => this._onDidChange.fire();
		this.disposables.push(
			this.fileWatcher.onDidCreate(fireChange),
			this.fileWatcher.onDidDelete(fireChange),
			this.fileWatcher.onDidChange(fireChange)
		);
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
