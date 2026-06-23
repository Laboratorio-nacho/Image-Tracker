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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const imageScanner_1 = require("./imageScanner");
const imageTreeProvider_1 = require("./imageTreeProvider");
let scanner;
let treeProvider;
function activate(context) {
    scanner = new imageScanner_1.ImageScanner();
    treeProvider = new imageTreeProvider_1.ImageTreeProvider();
    const treeView = vscode.window.createTreeView('imageTracker', {
        treeDataProvider: treeProvider
    });
    context.subscriptions.push(treeView);
    context.subscriptions.push(vscode.commands.registerCommand('image-tracker.refreshImages', async () => {
        const images = await scanner.scanImages();
        treeProvider.refresh(images);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('image-tracker.openImage', (uri) => {
        vscode.commands.executeCommand('vscode.open', uri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('image-tracker.openReference', (ref) => {
        vscode.workspace.openTextDocument(ref.file).then(doc => {
            vscode.window.showTextDocument(doc, { selection: new vscode.Range(ref.line - 1, ref.column - 1, ref.line - 1, ref.column - 1) });
        });
    }));
    scanner.onDidChange(() => {
        vscode.commands.executeCommand('image-tracker.refreshImages');
    });
    scanner.watch();
    vscode.commands.executeCommand('image-tracker.refreshImages');
}
function deactivate() {
    scanner?.dispose();
}
//# sourceMappingURL=extension.js.map