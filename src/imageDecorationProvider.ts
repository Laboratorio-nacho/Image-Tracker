import * as vscode from 'vscode';
import { ImageScanner } from './imageScanner';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'tif']);

export class ImageDecorationProvider implements vscode.FileDecorationProvider {
	private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri[]>();
	readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

	private usedImages = new Set<string>();
	private disposables: vscode.Disposable[] = [];

	constructor(private scanner: ImageScanner) {
		this.disposables.push(
			this.scanner.onDidChange(() => this.refresh())
		);
	}

	async refresh(): Promise<void> {
		const prev = new Set(this.usedImages);
		const images = await this.scanner.scanImages();

		this.usedImages.clear();
		const changed: vscode.Uri[] = [];

		for (const img of images) {
			const key = img.uri.toString();
			this.usedImages.add(key);
			if (!prev.has(key)) {
				changed.push(img.uri);
			}
		}

		for (const key of prev) {
			if (!this.usedImages.has(key)) {
				changed.push(vscode.Uri.parse(key));
			}
		}

		if (changed.length > 0) {
			this._onDidChangeFileDecorations.fire(changed);
		}
	}

	provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
		const ext = uri.path.split('.').pop()?.toLowerCase();
		if (!ext || !IMAGE_EXTENSIONS.has(ext)) {
			return undefined;
		}

		const key = uri.toString();
		const isUsed = this.usedImages.has(key);

		if (isUsed) {
			return {
				badge: '\u2714',
				tooltip: 'Image is used in project',
				color: new vscode.ThemeColor('testing.iconPassed'),
			};
		}

		return {
			badge: '\u2718',
			tooltip: 'Image is NOT used in project',
			color: new vscode.ThemeColor('testing.iconFailed'),
		};
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this._onDidChangeFileDecorations.dispose();
	}
}
