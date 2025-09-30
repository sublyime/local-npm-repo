# Local NPM Repository Manager

A VS Code extension that manages a local cache of npm packages to avoid redundant downloads across projects. This extension helps speed up your development workflow by maintaining a local repository of frequently used packages.

## Features

- **Local Package Caching**: Automatically caches npm packages in a local repository
- **Smart Installation**: Checks local repository first, falls back to npm registry if needed
- **Version Management**: Keeps track of package versions and suggests updates
- **Daily Update Checks**: Automatically checks for package updates once per day
- **Workspace Integration**: Seamlessly integrates with VS Code workspace commands

## Commands

The extension provides the following commands accessible through the Command Palette (Ctrl+Shift+P):

- `Local NPM Repo: Install Package` - Install a package from local repo or npm registry
- `Local NPM Repo: Check for Updates` - Manually check for package updates
- `Local NPM Repo: Show Local Packages` - Display all cached packages in local repository

## How It Works

1. When you install a package, the extension first checks if it exists in your local repository
2. If found locally, it installs from the local cache (faster)
3. If not found locally, it downloads from npm registry and caches it for future use
4. The extension automatically checks for updates daily and suggests upgrades

## Usage

1. Open a workspace with a Node.js project
2. Use the Command Palette (Ctrl+Shift+P) and search for "Local NPM Repo"
3. Select "Install Package" and enter the package name
4. The extension will handle the rest automatically

## Local Repository Location

The local repository is stored in your VS Code extension's global storage directory, ensuring it persists across workspace sessions and is shared among all your projects.

## Requirements

- Node.js and npm installed on your system
- VS Code 1.104.0 or higher

## Known Issues

- Large packages may take some time to cache initially
- Network connectivity required for initial downloads and update checks

## Release Notes

### 0.0.1

Initial release with core functionality:
- Local package caching
- Smart installation logic
- Version checking and updates
- Command palette integration

---

## Development

To run the extension in development mode:

1. Open this folder in VS Code
2. Press F5 to open a new Extension Development Host window
3. Test the extension commands in the new window

## Building

```bash
npm run compile
```

## Testing

```bash
npm test
```

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
