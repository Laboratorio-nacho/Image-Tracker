"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/imageScanner.ts
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"];
var ImageScanner = class {
  disposables = [];
  fileWatcher;
  _onDidChange = new vscode.EventEmitter();
  onDidChange = this._onDidChange.event;
  async scanImages() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }
    const pattern = `**/*.{${IMAGE_EXTENSIONS.join(",")}}`;
    const imageUris = await vscode.workspace.findFiles(pattern, "**/node_modules/**");
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
    const escapedPath = relativePath.replace(/\\/g, "/");
    const imageName = path.basename(escapedPath);
    const refs = [];
    const files = await vscode.workspace.findFiles(
      "**/*.{md,html,ts,tsx,js,jsx,css,scss,less,vue,svelte,json,yml,yaml}",
      "**/node_modules/**"
    );
    for (const file of files) {
      if (file.fsPath === imageUri.fsPath) {
        continue;
      }
      try {
        const content = (await vscode.workspace.fs.readFile(file)).toString();
        const lines = content.split("\n");
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
      }
    }
    return refs;
  }
  watch() {
    this.dispose();
    const pattern = `**/*.{${IMAGE_EXTENSIONS.join(",")}}`;
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    const fireChange = () => this._onDidChange.fire();
    this.disposables.push(
      this.fileWatcher.onDidCreate(fireChange),
      this.fileWatcher.onDidDelete(fireChange),
      this.fileWatcher.onDidChange(fireChange)
    );
  }
  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
};

// src/imageTreeProvider.ts
var vscode2 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));
var ImageTreeProvider = class {
  _onDidChangeTreeData = new vscode2.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  images = [];
  refresh(images) {
    this.images = images;
    this._onDidChangeTreeData.fire(void 0);
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
    const groups = /* @__PURE__ */ new Map();
    for (const img of this.images) {
      const folder = path2.dirname(img.uri.fsPath);
      const group = groups.get(folder) || [];
      group.push(img);
      groups.set(folder, group);
    }
    const nodes = [];
    for (const [folder, items] of groups) {
      const folderNode = new ImageNode(
        path2.basename(folder),
        vscode2.TreeItemCollapsibleState.Collapsed,
        "folder",
        vscode2.Uri.file(folder)
      );
      folderNode.description = folder;
      folderNode.iconPath = vscode2.ThemeIcon.Folder;
      folderNode.children = items.map((item) => {
        const node = new ImageNode(
          path2.basename(item.uri.fsPath),
          item.references.length > 0 ? vscode2.TreeItemCollapsibleState.Collapsed : vscode2.TreeItemCollapsibleState.None,
          "image",
          item.uri,
          item
        );
        node.description = `${item.references.length} ref${item.references.length !== 1 ? "s" : ""}`;
        node.iconPath = vscode2.ThemeIcon.File;
        node.command = {
          command: "image-tracker.openImage",
          title: "Open Image",
          arguments: [item.uri]
        };
        return node;
      });
      nodes.push(folderNode);
    }
    return nodes;
  }
  getReferenceNodes(image) {
    return image.references.map((ref) => {
      const node = new ImageNode(
        `${path2.basename(ref.file.fsPath)}:${ref.line}`,
        vscode2.TreeItemCollapsibleState.None,
        "reference",
        ref.file
      );
      node.description = `line ${ref.line}`;
      node.iconPath = vscode2.ThemeIcon.File;
      node.command = {
        command: "image-tracker.openReference",
        title: "Open Reference",
        arguments: [ref]
      };
      return node;
    });
  }
};
var ImageNode = class extends vscode2.TreeItem {
  constructor(label, collapsibleState, type, resourceUri, image) {
    super(label, collapsibleState);
    this.label = label;
    this.type = type;
    this.resourceUri = resourceUri;
    this.image = image;
    this.tooltip = resourceUri.fsPath;
    this.contextValue = type;
  }
  label;
  type;
  resourceUri;
  image;
  children;
};

// src/extension.ts
var scanner;
var treeProvider;
function activate(context) {
  scanner = new ImageScanner();
  treeProvider = new ImageTreeProvider();
  const treeView = vscode3.window.createTreeView("imageTracker", {
    treeDataProvider: treeProvider
  });
  context.subscriptions.push(treeView);
  context.subscriptions.push(
    vscode3.commands.registerCommand("image-tracker.refreshImages", async () => {
      const images = await scanner.scanImages();
      treeProvider.refresh(images);
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("image-tracker.openImage", (uri) => {
      vscode3.commands.executeCommand("vscode.open", uri);
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("image-tracker.openReference", (ref) => {
      vscode3.workspace.openTextDocument(ref.file).then((doc) => {
        vscode3.window.showTextDocument(doc, { selection: new vscode3.Range(ref.line - 1, ref.column - 1, ref.line - 1, ref.column - 1) });
      });
    })
  );
  scanner.onDidChange(() => {
    vscode3.commands.executeCommand("image-tracker.refreshImages");
  });
  scanner.watch();
  vscode3.commands.executeCommand("image-tracker.refreshImages");
}
function deactivate() {
  scanner?.dispose();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
