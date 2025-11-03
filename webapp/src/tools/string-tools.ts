// String tools definitions
import { Tool, ToolGroup } from '../types';
import { stringUtils } from '../lib/utils/string';
import { lowercaseTool, capitalCaseTool, reverseTool } from './placeholder-tools';

// Define individual string tools
export const uppercaseTool: Tool = {
  id: 'string-uppercase',
  name: 'Uppercase',
  description: 'Convert text to uppercase letters',
  category: 'string',
  aliases: ['upper', 'uc', 'caps'],
  operation: stringUtils.case.uppercase,
};

// Export all string tools as a group
export const stringToolsGroup: ToolGroup = {
  category: 'string',
  name: 'Text Tools',
  description: 'String manipulation and transformation utilities',
  icon: '📝',
  tools: [
    uppercaseTool,
    lowercaseTool,
    capitalCaseTool,
    reverseTool,
  ],
};