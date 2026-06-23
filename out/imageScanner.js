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
exports.ImageScanner = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
class ImageScanner {
    disposables = [];
    fileWatcher;
    _onDidChange = new vscode.EventEmitter();
    onDidChange = this._onDidChange.event;
    async scanImages() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }
        const pattern = `**/*.{${IMAGE_EXTENSIONS.join(',')}}`;
        const imageUris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
        const items = [];
        for (const uri of imageUris) {
            const references = await this.findReferences(uri);
            items.push({ uri, references });
        }
        return items;
    }
    async findReferences(imageUri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(imageUri);
        if (!workspaceFolder) {
            return [];
        }
        const relativePath = path.relative(workspaceFolder.uri.fsPath, imageUri.fsPath);
        const escapedPath = relativePath.replace(/\\/g, '/');
        const imageName = path.basename(escapedPath);
        const refs = [];
        const files = await vscode.workspace.findFiles('**/*.{md,html,ts,tsx,js,jsx,css,scss,less,vue,svelte,json,yml,yaml}', '**/node_modules/**');
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
            }
            catch {
                // skip binary files
            }
        }
        return refs;
    }
    watch() {
        this.dispose();
        const pattern = `**/*.{${IMAGE_EXTENSIONS.join(',')}}`;
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        const fireChange = () => this._onDidChange.fire();
        this.disposables.push(this.fileWatcher.onDidCreate(fireChange), this.fileWatcher.onDidDelete(fireChange), this.fileWatcher.onDidChange(fireChange));
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.ImageScanner = ImageScanner;
//# sourceMappingURL=imageScanner.js.map