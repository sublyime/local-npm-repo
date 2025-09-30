// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class LocalNpmRepository {
    private localRepoPath: string;
    private lastUpdateCheck: Date | null = null;

    constructor(context: vscode.ExtensionContext) {
        // Store local repository in extension's global storage path
        this.localRepoPath = path.join(context.globalStorageUri.fsPath, 'npm-cache');
        this.ensureDirectoryExists(this.localRepoPath);
    }

    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    private getPackagePath(packageName: string, version: string): string {
        return path.join(this.localRepoPath, packageName, version);
    }

    private async getLatestVersion(packageName: string): Promise<string> {
        try {
            const { stdout } = await execAsync(`npm view ${packageName} version`);
            return stdout.trim();
        } catch (error) {
            throw new Error(`Failed to get latest version for ${packageName}: ${error}`);
        }
    }

    private async downloadPackage(packageName: string, version: string): Promise<void> {
        const packagePath = this.getPackagePath(packageName, version);
        this.ensureDirectoryExists(packagePath);

        try {
            const { stdout } = await execAsync(`npm pack ${packageName}@${version}`, { cwd: packagePath });
            vscode.window.showInformationMessage(`Downloaded ${packageName}@${version} to local repository`);
        } catch (error) {
            throw new Error(`Failed to download ${packageName}@${version}: ${error}`);
        }
    }

    public async isPackageAvailable(packageName: string, version?: string): Promise<boolean> {
        if (!version) {
            version = await this.getLatestVersion(packageName);
        }
        const packagePath = this.getPackagePath(packageName, version);
        return fs.existsSync(packagePath);
    }

    public async installFromLocal(packageName: string, version?: string, targetPath?: string): Promise<boolean> {
        if (!version) {
            version = await this.getLatestVersion(packageName);
        }

        const isAvailable = await this.isPackageAvailable(packageName, version);
        if (!isAvailable) {
            return false;
        }

        const packagePath = this.getPackagePath(packageName, version);
        const installPath = targetPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!installPath) {
            vscode.window.showErrorMessage('No workspace folder found for installation');
            return false;
        }

        try {
            await execAsync(`npm install ${packagePath}`, { cwd: installPath });
            vscode.window.showInformationMessage(`Installed ${packageName}@${version} from local repository`);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to install from local repository: ${error}`);
            return false;
        }
    }

    public async installPackage(packageName: string, version?: string): Promise<void> {
        if (!version) {
            version = await this.getLatestVersion(packageName);
        }

        // Try to install from local repository first
        const installed = await this.installFromLocal(packageName, version);
        if (installed) {
            return;
        }

        // Fallback to npm registry
        const installPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!installPath) {
            vscode.window.showErrorMessage('No workspace folder found for installation');
            return;
        }

        try {
            await execAsync(`npm install ${packageName}@${version}`, { cwd: installPath });
            // Cache the package for future use
            await this.downloadPackage(packageName, version);
            vscode.window.showInformationMessage(`Installed ${packageName}@${version} from npm registry and cached locally`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to install ${packageName}@${version}: ${error}`);
        }
    }

    public async checkForUpdates(): Promise<void> {
        const now = new Date();
        if (this.lastUpdateCheck && (now.getTime() - this.lastUpdateCheck.getTime()) < 24 * 60 * 60 * 1000) {
            return; // Already checked within 24 hours
        }

        vscode.window.showInformationMessage('Checking for package updates in local repository...');
        
        try {
            const packages = this.getLocalPackages();
            for (const pkg of packages) {
                const latestVersion = await this.getLatestVersion(pkg.name);
                if (pkg.version !== latestVersion) {
                    const choice = await vscode.window.showInformationMessage(
                        `Update available for ${pkg.name}: ${pkg.version} → ${latestVersion}`,
                        'Update', 'Skip'
                    );
                    if (choice === 'Update') {
                        await this.downloadPackage(pkg.name, latestVersion);
                    }
                }
            }
            this.lastUpdateCheck = now;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to check for updates: ${error}`);
        }
    }

    private getLocalPackages(): Array<{ name: string; version: string }> {
        const packages: Array<{ name: string; version: string }> = [];
        
        if (!fs.existsSync(this.localRepoPath)) {
            return packages;
        }

        const packageDirs = fs.readdirSync(this.localRepoPath);
        for (const packageName of packageDirs) {
            const packagePath = path.join(this.localRepoPath, packageName);
            if (fs.statSync(packagePath).isDirectory()) {
                const versions = fs.readdirSync(packagePath);
                for (const version of versions) {
                    if (fs.statSync(path.join(packagePath, version)).isDirectory()) {
                        packages.push({ name: packageName, version });
                    }
                }
            }
        }
        
        return packages;
    }

    public showLocalPackages(): void {
        const packages = this.getLocalPackages();
        if (packages.length === 0) {
            vscode.window.showInformationMessage('No packages found in local repository');
            return;
        }

        const packageList = packages.map(pkg => `${pkg.name}@${pkg.version}`).join('\n');
        vscode.window.showInformationMessage(`Local packages:\n${packageList}`);
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Local NPM Repository Manager is now active!');

    const localRepo = new LocalNpmRepository(context);

    // Register commands
    const installCommand = vscode.commands.registerCommand('local-npm-repository-manager.installPackage', async () => {
        const packageName = await vscode.window.showInputBox({
            prompt: 'Enter package name to install',
            placeHolder: 'e.g., lodash, express, react'
        });

        if (packageName) {
            const version = await vscode.window.showInputBox({
                prompt: 'Enter version (leave empty for latest)',
                placeHolder: 'e.g., 1.0.0 or leave empty'
            });
            await localRepo.installPackage(packageName, version || undefined);
        }
    });

    const checkUpdatesCommand = vscode.commands.registerCommand('local-npm-repository-manager.checkUpdates', async () => {
        await localRepo.checkForUpdates();
    });

    const showPackagesCommand = vscode.commands.registerCommand('local-npm-repository-manager.showPackages', () => {
        localRepo.showLocalPackages();
    });

    const helloWorldCommand = vscode.commands.registerCommand('local-npm-repository-manager.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Local NPM Repository Manager!');
    });

    // Check for updates on activation
    localRepo.checkForUpdates();

    context.subscriptions.push(installCommand, checkUpdatesCommand, showPackagesCommand, helloWorldCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
