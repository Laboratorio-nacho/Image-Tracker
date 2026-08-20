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
		const normalizedPath = relativePath.replace(/\\/g, '/');
		const imageName = path.basename(normalizedPath);
		const imageNameWithoutExt = path.basename(normalizedPath, path.extname(normalizedPath));

		console.log(`[image-tracker] buscanco refs para: ${normalizedPath}`);
		console.log(`[image-tracker] patrones: ${[normalizedPath, `./${normalizedPath}`, imageName, imageNameWithoutExt].join(', ')}`);

		const searchPatterns = [
			normalizedPath,
			`./${normalizedPath}`,
			`../${normalizedPath}`,
			imageName,
			imageNameWithoutExt,
		];

		const refs: ImageReference[] = [];
		const refPattern = `**/*.{${REFERENCE_EXTENSIONS}}`;
		console.log(`[image-tracker] pattern de busqueda: ${refPattern}`);
		const files = await vscode.workspace.findFiles(refPattern, IGNORE_PATTERNS);
		console.log(`[image-tracker] ${files.length} archivos para revisar`);

		for (const file of files) {
			if (file.fsPath === imageUri.fsPath) {
				continue;
			}

			try {
				const bytes = await vscode.workspace.fs.readFile(file);
				const content = new TextDecoder('utf-8').decode(bytes);
				const lines = content.split('\n');
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					for (const pattern of searchPatterns) {
						const col = line.indexOf(pattern);
						if (col !== -1) {
							console.log(`[image-tracker] REF ENCONTRADA: ${file.fsPath}:${i+1} (patron: "${pattern}")`);
							refs.push({ file, line: i + 1, column: col + 1 });
							break;
						}
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
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
