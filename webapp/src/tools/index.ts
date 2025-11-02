// Tool registry - central place for all tools
import { Tool, ToolGroup } from '../types';
import { stringToolsGroup } from './stringTools';
import {
  encodingToolsGroup,
  securityToolsGroup,
  dataFormatToolsGroup,
  generatorToolsGroup,
  datetimeToolsGroup
} from './placeholderTools';

// All tool groups
export const toolGroups: ToolGroup[] = [
  stringToolsGroup,
  encodingToolsGroup,
  securityToolsGroup,
  dataFormatToolsGroup,
  generatorToolsGroup,
  datetimeToolsGroup,
];

// Flatten all tools for easy access
export const allTools: Tool[] = toolGroups.flatMap(group => group.tools);

// Tool lookup functions
export const getToolById = (id: string): Tool | undefined => {
  return allTools.find(tool => tool.id === id);
};

export const getToolsByCategory = (category: string): Tool[] => {
  return allTools.filter(tool => tool.category === category);
};

export const searchTools = (query: string): Tool[] => {
  const normalizedQuery = query.toLowerCase();
  return allTools.filter(tool =>
    tool.name.toLowerCase().includes(normalizedQuery) ||
    tool.description.toLowerCase().includes(normalizedQuery) ||
    tool.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))
  );
};