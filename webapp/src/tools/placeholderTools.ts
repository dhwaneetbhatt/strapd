// Placeholder tools for demonstration - these will be replaced with real implementations
import { Tool, ToolGroup, ToolResult } from '../types';

// Placeholder operation that shows "not implemented" message
const notImplemented = (toolName: string) => (_input: string): ToolResult => ({
  success: false,
  error: `${toolName} is not yet implemented. This is a placeholder for the full feature.`
});

// String Tools (additional to uppercase)
export const lowercaseTool: Tool = {
  id: 'string-lowercase',
  name: 'Lowercase',
  description: 'Convert text to lowercase letters',
  category: 'string',
  aliases: ['lower', 'lc'],
  operation: notImplemented('Lowercase'),
};

export const capitalCaseTool: Tool = {
  id: 'string-capital-case',
  name: 'Title Case',
  description: 'Convert text to Title Case',
  category: 'string',
  aliases: ['title', 'capital'],
  operation: notImplemented('Title Case'),
};

export const reverseTool: Tool = {
  id: 'string-reverse',
  name: 'Reverse Text',
  description: 'Reverse the order of characters',
  category: 'string',
  aliases: ['rev'],
  operation: notImplemented('Reverse Text'),
};

// Encoding Tools
export const base64EncodeTool: Tool = {
  id: 'encoding-base64-encode',
  name: 'Base64 Encode',
  description: 'Encode text to Base64',
  category: 'encoding',
  aliases: ['b64encode'],
  operation: notImplemented('Base64 Encode'),
};

export const base64DecodeTool: Tool = {
  id: 'encoding-base64-decode',
  name: 'Base64 Decode',
  description: 'Decode Base64 to text',
  category: 'encoding',
  aliases: ['b64decode'],
  operation: notImplemented('Base64 Decode'),
};

export const urlEncodeTool: Tool = {
  id: 'encoding-url-encode',
  name: 'URL Encode',
  description: 'Encode text for URLs',
  category: 'encoding',
  aliases: ['urlencode'],
  operation: notImplemented('URL Encode'),
};

// Security Tools
export const md5HashTool: Tool = {
  id: 'security-md5',
  name: 'MD5 Hash',
  description: 'Generate MD5 hash',
  category: 'security',
  aliases: ['md5'],
  operation: notImplemented('MD5 Hash'),
};

export const sha256HashTool: Tool = {
  id: 'security-sha256',
  name: 'SHA256 Hash',
  description: 'Generate SHA256 hash',
  category: 'security',
  aliases: ['sha256'],
  operation: notImplemented('SHA256 Hash'),
};

// Data Format Tools
export const jsonFormatterTool: Tool = {
  id: 'data-json-format',
  name: 'JSON Formatter',
  description: 'Format and beautify JSON',
  category: 'dataFormats',
  aliases: ['json', 'jsonformat'],
  operation: notImplemented('JSON Formatter'),
};

export const jsonMinifierTool: Tool = {
  id: 'data-json-minify',
  name: 'JSON Minifier',
  description: 'Minify JSON by removing whitespace',
  category: 'dataFormats',
  aliases: ['jsonmin'],
  operation: notImplemented('JSON Minifier'),
};

// Generator Tools
export const uuidGeneratorTool: Tool = {
  id: 'generator-uuid',
  name: 'UUID Generator',
  description: 'Generate random UUID',
  category: 'identifiers',
  aliases: ['uuid'],
  operation: notImplemented('UUID Generator'),
};

export const randomStringTool: Tool = {
  id: 'generator-random-string',
  name: 'Random String',
  description: 'Generate random string',
  category: 'random',
  aliases: ['randstr'],
  operation: notImplemented('Random String'),
};

// DateTime Tools
export const timestampTool: Tool = {
  id: 'datetime-timestamp',
  name: 'Current Timestamp',
  description: 'Get current Unix timestamp',
  category: 'datetime',
  aliases: ['ts', 'now'],
  operation: notImplemented('Current Timestamp'),
};

// Tool Groups
export const encodingToolsGroup: ToolGroup = {
  category: 'encoding',
  name: 'Encoding Tools',
  description: 'Text encoding and decoding utilities',
  icon: '🔄',
  tools: [base64EncodeTool, base64DecodeTool, urlEncodeTool],
};

export const securityToolsGroup: ToolGroup = {
  category: 'security',
  name: 'Security Tools',
  description: 'Cryptographic and security utilities',
  icon: '🔐',
  tools: [md5HashTool, sha256HashTool],
};

export const dataFormatToolsGroup: ToolGroup = {
  category: 'dataFormats',
  name: 'Data Tools',
  description: 'Data formatting and transformation',
  icon: '📋',
  tools: [jsonFormatterTool, jsonMinifierTool],
};

export const generatorToolsGroup: ToolGroup = {
  category: 'identifiers',
  name: 'Generators',
  description: 'Generate UUIDs and random data',
  icon: '🎲',
  tools: [uuidGeneratorTool, randomStringTool],
};

export const datetimeToolsGroup: ToolGroup = {
  category: 'datetime',
  name: 'Time Tools',
  description: 'Date and time utilities',
  icon: '⏰',
  tools: [timestampTool],
};