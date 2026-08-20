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

const REFERENCE_EXTENSIONS = 'md,html,ts,tsx,js,jsx,css,scss,less,vue,svelte,json,yml,yaml';

export class ImageScanner {
	private disposables: vscode.Disposable[] = [];
	private fileWatcher: vscode.FileSystemWatcher | undefined;
	private _onDidChange = new vscode.EventEmitter<void>();
	readonly onDidChange = this._onDidChange.event;
	private _onDidChangeImages = new vscode.EventEmitter<ImageItem[]>();
	readonly onDidChangeImages = this._onDidChangeImages.event;
	private currentCts: vscode.CancellationTokenSource | undefined;

	async scanImages(): Promise<ImageItem[]> {
		if (this.currentCts) {
			this.currentCts.cancel();
		}
		this.currentCts = new vscode.CancellationTokenSource();
		const token = this.currentCts.token;

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}

		const imagePattern = `**/*.{${IMAGE_EXTENSIONS.join(',')}}`;
		const imageUris = await vscode.workspace.findFiles(imagePattern, IGNORE_PATTERNS, undefined, token);

		if (token.isCancellationRequested) {
			return [];
		}

		const imagePaths = new Map<string, vscode.Uri>();
		const imageSearchTerms = new Map<string, string[]>();

		for (const uri of imageUris) {
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
			if (!workspaceFolder) {
				continue;
			}

			const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
			const normalizedPath = relativePath.replace(/\\/g, '/');
			const imageName = path.basename(normalizedPath);
			const imageNameWithoutExt = path.basename(normalizedPath, path.extname(normalizedPath));

			const key = normalizedPath.toLowerCase();
			imagePaths.set(key, uri);
			imageSearchTerms.set(key, [
				normalizedPath,
				`./${normalizedPath}`,
				`../${normalizedPath}`,
				imageName,
				imageNameWithoutExt,
			]);
		}

		const refsMap = new Map<string, ImageReference[]>();
		for (const key of imagePaths.keys()) {
			refsMap.set(key, []);
		}

		const refPattern = `**/*.{${REFERENCE_EXTENSIONS}}`;
		const codeFiles = await vscode.workspace.findFiles(refPattern, IGNORE_PATTERNS, undefined, token);

		if (token.isCancellationRequested) {
			return [];
		}

		for (const file of codeFiles) {
			try {
				const bytes = await vscode.workspace.fs.readFile(file);
				const content = new TextDecoder('utf-8').decode(bytes);
				const lines = content.split('\n');

				for (let i = 0; i < lines.length; i++) {
					const lowerLine = lines[i].toLowerCase();
					for (const [key, patterns] of imageSearchTerms) {
						for (const pattern of patterns) {
							const col = lowerLine.indexOf(pattern.toLowerCase());
							if (col !== -1) {
								const existing = refsMap.get(key);
								if (existing) {
									existing.push({ file, line: i + 1, column: col + 1 });
								}
								break;
							}
						}
					}
				}
			} catch {
				// skip unreadable files
			}
		}

		const items: ImageItem[] = [];
		for (const [key, uri] of imagePaths) {
			items.push({ uri, references: refsMap.get(key) || [] });
		}

		this._onDidChangeImages.fire(items);
		return items;
	}

	watch(): void {
		this.dispose();
		const imgPattern = `**/*.{${IMAGE_EXTENSIONS.join(',')}}`;
		const refPattern = `**/*.{${REFERENCE_EXTENSIONS}}`;
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(`{${imgPattern},${refPattern}}`);

		const fireChange = () => this._onDidChange.fire();
		this.disposables.push(
			this.fileWatcher.onDidCreate(fireChange),
			this.fileWatcher.onDidDelete(fireChange),
			this.fileWatcher.onDidChange(fireChange)
		);
	}

	dispose(): void {
		this.currentCts?.cancel();
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
