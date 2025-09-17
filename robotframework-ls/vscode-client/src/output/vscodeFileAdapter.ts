/**
 * VSCode adapter for the file processor.
 * Provides VSCode-specific implementations of the file processing functionality.
 */

import * as vscode from "vscode";
import { FileProcessor, IFileProcessorOptions, IProcessedFile } from "./fileProcessor";
import { TextDecoder } from "util";

export class VSCodeFileProcessorAdapter {
    private fileProcessor: FileProcessor;

    constructor() {
        this.fileProcessor = new FileProcessor({
            xmlToRobostreamConverter: this.createVSCodeXmlConverter()
        });
    }

    /**
     * Creates a VSCode-specific XML to robostream converter
     */
    private createVSCodeXmlConverter() {
        return async (xmlContent: string): Promise<string> => {
            const converted: string = await vscode.commands.executeCommand(
                "robot.convertOutputXMLToRobostream", 
                { xml_contents: xmlContent }
            );
            return converted;
        };
    }

    /**
     * Processes the currently active editor's document
     * @param token VSCode cancellation token
     * @returns Processed file information or null
     */
    async processActiveEditorDocument(token?: vscode.CancellationToken): Promise<IProcessedFile | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        if (token?.isCancellationRequested) {
            return null;
        }

        const filePath = editor.document.uri.fsPath;
        const fileContent = editor.document.getText();

        const options: IFileProcessorOptions = {
            cancellationToken: token
        };

        return await this.fileProcessor.processFile(filePath, fileContent, options);
    }

    /**
     * Processes a file by path
     * @param filePath Path to the file
     * @param token VSCode cancellation token
     * @returns Processed file information or null
     */
    async processFileByPath(filePath: string, token?: vscode.CancellationToken): Promise<IProcessedFile | null> {
        if (token?.isCancellationRequested) {
            return null;
        }

        try {
            const uri = vscode.Uri.file(filePath);
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const textContent = new TextDecoder('utf-8').decode(fileContent);

            const options: IFileProcessorOptions = {
                cancellationToken: token
            };

            return await this.fileProcessor.processFile(filePath, textContent, options);
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Checks if a file is supported for processing
     * @param filePath Path to the file
     * @returns True if the file is supported
     */
    isSupportedFile(filePath: string): boolean {
        return this.fileProcessor.isSupportedFile(filePath);
    }
}

/**
 * Default VSCode adapter instance
 */
export const defaultVSCodeAdapter = new VSCodeFileProcessorAdapter();