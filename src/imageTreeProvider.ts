import * as vscode from 'vscode';
import * as path from 'path';
import { ImageItem, ImageReference } from './imageScanner';

const USED_ICON = statusIcon('#2da44e');
const UNUSED_ICON = statusIcon('#e5533d');

function statusIcon(color: string): vscode.Uri {
	const svg = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">',
		`  <circle cx="1.5" cy="8" r="1.5" fill="${color}"/>`,
		'  <path d="M10 0H4.5A1.5 1.5 0 0 0 3 1.5v13A1.5 1.5 0 0 0 4.5 16h7A1.5 1.5 0 0 0 13 14.5V5L10 0z" fill="#C5C5C5"/>',
		'  <path d="M10 0v3a2 2 0 0 0 2 2h1" fill="none" stroke="#C5C5C5" stroke-width="1"/>',
		'</svg>',
	].join('\n');
	return vscode.Uri.parse(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
}

export class ImageTreeProvider implements vscode.TreeDataProvider<ImageNode> {
	private _onDidChangeTreeData = new vscode.EventEmitter<ImageNode | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private images: ImageItem[] = [];

	refresh(images: ImageItem[]): void {
		this.images = images;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: ImageNode): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ImageNode): Thenable<ImageNode[]> {
		if (!element) {
			return Promise.resolve(this.getRootNodes());
		}
		return Promise.resolve(element.children ?? []);
	}

	private getRootNodes(): ImageNode[] {
		const groups = new Map<string, ImageItem[]>();
		for (const img of this.images) {
			const folder = path.dirname(img.uri.fsPath);
			const group = groups.get(folder) || [];
			group.push(img);
			groups.set(folder, group);
		}

		const nodes: ImageNode[] = [];
		for (const [folder, items] of groups) {
			const folderNode = new ImageNode(
				path.basename(folder),
				vscode.TreeItemCollapsibleState.Collapsed,
				'folder',
				vscode.Uri.file(folder)
			);
			folderNode.description = folder;
			folderNode.iconPath = vscode.ThemeIcon.Folder;
			folderNode.children = items.map(item => {
				const node = new ImageNode(
					path.basename(item.uri.fsPath),
					item.references.length > 0
						? vscode.TreeItemCollapsibleState.Collapsed
						: vscode.TreeItemCollapsibleState.None,
					'image',
					item.uri,
					item
				);
				node.description = item.references.length > 0
				? `in: ${[...new Set(item.references.map(r => path.basename(r.file.fsPath)))].join(', ')}`
				: 'unused';
				node.iconPath = item.references.length > 0 ? USED_ICON : UNUSED_ICON;
				node.children = this.getReferenceNodes(item);
				node.command = {
					command: 'image-tracker.openImage',
					title: 'Open Image',
					arguments: [item.uri]
				};
				return node;
			});
			nodes.push(folderNode);
		}

		return nodes;
	}

	private getReferenceNodes(image: ImageItem): ImageNode[] {
		return image.references.map(ref => {
			const node = new ImageNode(
				`${path.basename(ref.file.fsPath)}:${ref.line}`,
				vscode.TreeItemCollapsibleState.None,
				'reference',
				ref.file
			);
			node.description = `line ${ref.line}`;
			node.iconPath = vscode.ThemeIcon.File;
			node.command = {
				command: 'image-tracker.openReference',
				title: 'Open Reference',
				arguments: [ref]
			};
			return node;
		});
	}
}

class ImageNode extends vscode.TreeItem {
	children: ImageNode[] | undefined;

	constructor(
		public readonly label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly type: 'folder' | 'image' | 'reference',
		public readonly resourceUri: vscode.Uri,
		public readonly image?: ImageItem
	) {
		super(label, collapsibleState);
		this.tooltip = resourceUri.fsPath;
		this.contextValue = type;
	}
}

export type { ImageNode };
