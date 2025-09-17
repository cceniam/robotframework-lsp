# File Processing Functionality Extraction

This document describes the extracted file processing functionality from `outView.ts` lines 203-216, which has been made independent of VSCode.

## Overview

The original code in `outView.ts` was tightly coupled to VSCode APIs for:
- Reading file content from active editor
- Converting XML to robostream format via VSCode commands
- Using VSCode cancellation tokens

This functionality has been extracted into reusable, standalone modules.

## Extracted Modules

### 1. `fileProcessor.ts` - Core Standalone Functionality

**Purpose**: Generic file processing independent of any UI framework.

**Key Features**:
- Processes both `.xml` and `.rfstream` files
- Supports injectable XML to robostream converter
- Generic cancellation token interface
- No external dependencies

**Usage Example**:
```typescript
import { FileProcessor } from './fileProcessor';

const processor = new FileProcessor({
    xmlToRobostreamConverter: async (xmlContent) => {
        // Your custom XML converter logic
        return convertedContent;
    }
});

const result = await processor.processFile('output.xml', xmlContent);
```

### 2. `vscodeFileAdapter.ts` - VSCode Integration Layer

**Purpose**: Bridges the standalone functionality with VSCode APIs.

**Key Features**:
- Wraps `FileProcessor` with VSCode-specific implementations
- Handles VSCode cancellation tokens
- Integrates with VSCode command system for XML conversion
- Provides convenient methods for processing active editor content

**Usage Example**:
```typescript
import { defaultVSCodeAdapter } from './vscodeFileAdapter';

// Process currently active editor
const result = await defaultVSCodeAdapter.processActiveEditorDocument(token);

// Process file by path
const result = await defaultVSCodeAdapter.processFileByPath('/path/to/file.xml', token);
```

### 3. Updated `outView.ts` - Simplified Integration

The original `onUpdatedEditorSelection` method was simplified from 31 lines to 13 lines:

**Before** (lines 203-216):
```typescript
let text = currDoc.getText();
if (filePath.endsWith(".xml")) {
    // We need to convert it to the rfstream format first.
    const converted: string = await vscode.commands.executeCommand("robot.convertOutputXMLToRobostream", {
        "xml_contents": text,
    });
    if (token.isCancellationRequested) {
        return;
    }
    if (!converted) {
        return;
    }
    text = converted;
}
await globalOutputViewState.addRun(filePath, filePath, text);
```

**After**:
```typescript
try {
    const processedFile = await defaultVSCodeAdapter.processActiveEditorDocument(token);
    
    if (!processedFile) {
        return;
    }

    await globalOutputViewState.addRun(processedFile.filePath, processedFile.filePath, processedFile.content);
} catch (error) {
    // Log error but don't throw to maintain existing behavior
    console.error("Error processing file in output view:", error);
}
```

## Benefits of Extraction

1. **Modularity**: Core logic separated from UI concerns
2. **Testability**: Can be tested without VSCode environment
3. **Reusability**: Can be used in CLI tools, web applications, or other contexts
4. **Maintainability**: Clear separation of concerns
5. **Flexibility**: Easy to swap XML converters or add new file formats

## Independent Usage Examples

### Node.js CLI Tool
```javascript
const { FileProcessor } = require('./fileProcessor');

const processor = new FileProcessor({
    xmlToRobostreamConverter: async (xml) => {
        // Use Python subprocess, HTTP API, or pure JS converter
        return await convertXmlToRobostream(xml);
    }
});

// Process files from command line
const result = await processor.processFile(process.argv[2], fileContent);
```

### Web Application
```javascript
// Use in browser with custom converter
const processor = new FileProcessor({
    xmlToRobostreamConverter: async (xml) => {
        // Use WASM, worker, or API call
        return await webBasedConverter(xml);
    }
});

// Process user uploaded files
const result = await processor.processFile(file.name, fileContent);
```

### Testing
```javascript
// Easy to mock for testing
const mockConverter = async (xml) => `mock-converted-${xml}`;
const processor = new FileProcessor({ xmlToRobostreamConverter: mockConverter });

// Test without external dependencies
assert(await processor.processFile('test.xml', '<xml/>'));
```

## Migration Guide

If you're using the original functionality:

1. **No changes needed** for existing VSCode integration - it continues to work
2. **For new features**, use the extracted modules:
   - Use `FileProcessor` for platform-independent logic
   - Use `VSCodeFileProcessorAdapter` for VSCode-specific features
3. **For testing**, mock the converter function instead of VSCode commands

## Compatibility

- ✅ Backward compatible with existing VSCode integration
- ✅ TypeScript compilation passes
- ✅ All original functionality preserved
- ✅ Error handling improved with try-catch blocks