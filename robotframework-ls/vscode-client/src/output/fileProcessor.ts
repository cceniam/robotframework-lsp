/**
 * Standalone file processor for handling Robot Framework output files.
 * This module provides functionality to process .xml and .rfstream files
 * independently of VSCode-specific APIs.
 */

export interface ICancellationToken {
    isCancellationRequested: boolean;
}

export interface IFileProcessorOptions {
    /**
     * Optional cancellation token to abort processing
     */
    cancellationToken?: ICancellationToken;
    
    /**
     * Function to convert XML content to robostream format
     */
    xmlToRobostreamConverter?: (xmlContent: string) => Promise<string>;
}

export interface IProcessedFile {
    filePath: string;
    content: string;
    originalFormat: 'xml' | 'rfstream';
}

export class FileProcessor {
    private xmlToRobostreamConverter?: (xmlContent: string) => Promise<string>;

    constructor(options: IFileProcessorOptions = {}) {
        this.xmlToRobostreamConverter = options.xmlToRobostreamConverter;
    }

    /**
     * Processes a file and returns its content in robostream format
     * @param filePath Path to the file
     * @param fileContent Content of the file
     * @param options Processing options
     * @returns Processed file information
     */
    async processFile(
        filePath: string, 
        fileContent: string, 
        options: IFileProcessorOptions = {}
    ): Promise<IProcessedFile | null> {
        // Check for cancellation
        if (options.cancellationToken?.isCancellationRequested) {
            return null;
        }

        // Determine file type based on extension
        if (!this.isSupportedFile(filePath)) {
            return null;
        }

        let processedContent = fileContent;
        let originalFormat: 'xml' | 'rfstream' = 'rfstream';

        if (filePath.endsWith('.xml')) {
            originalFormat = 'xml';
            
            // Check for cancellation before conversion
            if (options.cancellationToken?.isCancellationRequested) {
                return null;
            }

            // Use provided converter or the instance converter
            const converter = options.xmlToRobostreamConverter || this.xmlToRobostreamConverter;
            
            if (!converter) {
                throw new Error('XML to robostream converter is required for .xml files');
            }

            try {
                const convertedContent = await converter(fileContent);
                
                // Check for cancellation after conversion
                if (options.cancellationToken?.isCancellationRequested) {
                    return null;
                }

                if (!convertedContent) {
                    return null;
                }

                processedContent = convertedContent;
            } catch (error) {
                throw new Error(`Failed to convert XML to robostream: ${error.message}`);
            }
        }

        return {
            filePath,
            content: processedContent,
            originalFormat
        };
    }

    /**
     * Checks if a file is supported for processing
     * @param filePath Path to the file
     * @returns True if the file is supported
     */
    isSupportedFile(filePath: string): boolean {
        return filePath.endsWith('.xml') || filePath.endsWith('.rfstream');
    }

    /**
     * Sets the XML to robostream converter function
     * @param converter Converter function
     */
    setXmlToRobostreamConverter(converter: (xmlContent: string) => Promise<string>): void {
        this.xmlToRobostreamConverter = converter;
    }
}

/**
 * Default file processor instance
 */
export const defaultFileProcessor = new FileProcessor();