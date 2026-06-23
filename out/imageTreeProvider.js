"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class ImageTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    images = [];
    refresh(images) {
        this.images = images;
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.getRootNodes());
        }
        return Promise.resolve(element.children ?? []);
    }
    getRootNodes() {
        const groups = new Map();
        for (const img of this.images) {
            const folder = path.dirname(img.uri.fsPath);
            const group = groups.get(folder) || [];
            group.push(img);
            groups.set(folder, group);
        }
        const nodes = [];
        for (const [folder, items] of groups) {
            const folderNode = new ImageNode(path.basename(folder), vscode.TreeItemCollapsibleState.Collapsed, 'folder', vscode.Uri.file(folder));
            folderNode.description = folder;
            folderNode.iconPath = vscode.ThemeIcon.Folder;
            folderNode.children = items.map(item => {
                const node = new ImageNode(path.basename(item.uri.fsPath), item.references.length > 0
                    ? vscode.TreeItemCollapsibleState.Collapsed
                    : vscode.TreeItemCollapsibleState.None, 'image', item.uri, item);
                node.description = `${item.references.length} ref${item.references.length !== 1 ? 's' : ''}`;
                node.iconPath = vscode.ThemeIcon.File;
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
    getReferenceNodes(image) {
        return image.references.map(ref => {
            const node = new ImageNode(`${path.basename(ref.file.fsPath)}:${ref.line}`, vscode.TreeItemCollapsibleState.None, 'reference', ref.file);
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
exports.ImageTreeProvider = ImageTreeProvider;
class ImageNode extends vscode.TreeItem {
    label;
    type;
    resourceUri;
    image;
    children;
    constructor(label, collapsibleState, type, resourceUri, image) {
        super(label, collapsibleState);
        this.label = label;
        this.type = type;
        this.resourceUri = resourceUri;
        this.image = image;
        this.tooltip = resourceUri.fsPath;
        this.contextValue = type;
    }
}
//# sourceMappingURL=imageTreeProvider.js.map