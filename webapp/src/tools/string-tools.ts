// String tools definitions

import {
  AnalysisToolComponent,
  CaseConverterToolComponent,
  ReplaceToolComponent,
  ReverseToolComponent,
  SlugifyToolComponent,
  WhitespaceToolComponent,
} from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { stringUtils } from "../lib/utils/string";
import type { Tool, ToolGroup } from "../types";

// Type definitions for tools with multiple outputs
type CaseConverterResult = {
  uppercase?: string;
  lowercase?: string;
  capitalcase?: string;
};

type AnalysisResult = {
  lines?: number;
  words?: number;
  chars?: number;
  bytes?: number;
};

// Define consolidated case tool
const caseConverterToolDefinition: ToolDefinition<CaseConverterResult> = {
  id: "string-case-converter",
  name: "Case Converter",
  description: "Convert text to different cases",
  category: "string",
  aliases: ["case", "convert", "upper", "lower", "capital"],
  component: CaseConverterToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    if (!text.trim()) {
      return {
        success: true,
        uppercase: "",
        lowercase: "",
        capitalcase: "",
        result: "",
      };
    }

    const upper = stringUtils.case.uppercase(text);
    const lower = stringUtils.case.lowercase(text);
    const capital = stringUtils.case.capitalcase(text);

    return {
      success: true,
      uppercase: upper.result,
      lowercase: lower.result,
      capitalcase: capital.result,
      result: upper.result, // Default result
    };
  },
};

// Analysis Tool
const analysisToolDefinition: ToolDefinition<AnalysisResult> = {
  id: "string-analysis",
  name: "Text Analysis",
  description: "Count lines, words, chars and bytes",
  category: "string",
  aliases: ["count", "stats", "length", "analysis"],
  component: AnalysisToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");

    const lines = stringUtils.analysis.countLines(text);
    const words = stringUtils.analysis.countWords(text);
    const chars = stringUtils.analysis.countChars(text);
    const bytes = stringUtils.analysis.countBytes(text);

    // Parse the string results to numbers
    const linesNum = Number(lines.result);
    const wordsNum = Number(words.result);
    const charsNum = Number(chars.result);
    const bytesNum = Number(bytes.result);

    return {
      success: true,
      lines: linesNum,
      words: wordsNum,
      chars: charsNum,
      bytes: bytesNum,
      result: `Lines: ${linesNum}\nWords: ${wordsNum}\nChars: ${charsNum}\nBytes: ${bytesNum}`,
    };
  },
};

// Transform Tools
const reverseToolDefinition: ToolDefinition = {
  id: "string-reverse",
  name: "Reverse Text",
  description: "Reverse the text",
  category: "string",
  aliases: ["reverse", "flip", "backwards"],
  component: ReverseToolComponent,
  operation: (inputs) =>
    stringUtils.transform.reverse(String(inputs.text || "")),
};

const replaceToolDefinition: ToolDefinition = {
  id: "string-replace",
  name: "Find & Replace",
  description: "Replace occurrences of text with another text",
  category: "string",
  aliases: ["replace", "substitute", "find"],
  component: ReplaceToolComponent,
  operation: (inputs) =>
    stringUtils.transform.replace(
      String(inputs.text || ""),
      String(inputs.search || ""),
      String(inputs.replacement || ""),
    ),
};

const slugifyToolDefinition: ToolDefinition = {
  id: "string-slugify",
  name: "Slugify",
  description: "Convert text into a URL-friendly slug",
  category: "string",
  aliases: ["slug", "url", "kebab"],
  component: SlugifyToolComponent,
  operation: (inputs) =>
    stringUtils.transform.slugify(
      String(inputs.text || ""),
      String(inputs.separator || "-"),
    ),
};

// Whitespace Tool
const whitespaceToolDefinition: ToolDefinition = {
  id: "string-whitespace",
  name: "Trim",
  description: "Trim whitespace from text",
  category: "string",
  aliases: ["trim", "space", "clean"],
  component: WhitespaceToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const left = Boolean(inputs.left);
    const right = Boolean(inputs.right);
    const all = Boolean(inputs.all);

    // Smart mapping to handle core's mutually exclusive logic
    // Core logic: if left { trim_start } else if right { trim_end } else if all { collapse } else { trim }

    if (all) {
      // 'all' implies full trim + collapse. We must bypass left/right checks.
      return stringUtils.whitespace.trim(text, false, false, true);
    }

    if (left && right) {
      // Want both trimmed. Trigger 'else' block in core by sending all false.
      return stringUtils.whitespace.trim(text, false, false, false);
    }

    if (left) {
      // Only left
      return stringUtils.whitespace.trim(text, true, false, false);
    }

    if (right) {
      // Only right
      return stringUtils.whitespace.trim(text, false, true, false);
    }

    // Neither left nor right nor all. Return original text.
    return { success: true, result: text };
  },
};

// Create Tool wrappers
export const caseConverterTool: Tool<CaseConverterResult> = {
  id: caseConverterToolDefinition.id,
  name: caseConverterToolDefinition.name,
  description: caseConverterToolDefinition.description,
  category: caseConverterToolDefinition.category,
  aliases: caseConverterToolDefinition.aliases,
  operation: (inputs) => caseConverterToolDefinition.operation(inputs),
};

export const analysisTool: Tool<AnalysisResult> = {
  id: analysisToolDefinition.id,
  name: analysisToolDefinition.name,
  description: analysisToolDefinition.description,
  category: analysisToolDefinition.category,
  aliases: analysisToolDefinition.aliases,
  operation: (inputs) => analysisToolDefinition.operation(inputs),
};

export const reverseTool: Tool = {
  id: reverseToolDefinition.id,
  name: reverseToolDefinition.name,
  description: reverseToolDefinition.description,
  category: reverseToolDefinition.category,
  aliases: reverseToolDefinition.aliases,
  operation: (inputs) => reverseToolDefinition.operation(inputs),
};

export const replaceTool: Tool = {
  id: replaceToolDefinition.id,
  name: replaceToolDefinition.name,
  description: replaceToolDefinition.description,
  category: replaceToolDefinition.category,
  aliases: replaceToolDefinition.aliases,
  operation: (inputs) => replaceToolDefinition.operation(inputs),
};

export const slugifyTool: Tool = {
  id: slugifyToolDefinition.id,
  name: slugifyToolDefinition.name,
  description: slugifyToolDefinition.description,
  category: slugifyToolDefinition.category,
  aliases: slugifyToolDefinition.aliases,
  operation: (inputs) => slugifyToolDefinition.operation(inputs),
};

export const whitespaceTool: Tool = {
  id: whitespaceToolDefinition.id,
  name: whitespaceToolDefinition.name,
  description: whitespaceToolDefinition.description,
  category: whitespaceToolDefinition.category,
  aliases: whitespaceToolDefinition.aliases,
  operation: (inputs) => whitespaceToolDefinition.operation(inputs),
};

// Export all string tools as a group
export const stringToolsGroup: ToolGroup = {
  category: "string",
  name: "Text Tools",
  description: "String manipulation and transformation utilities",
  icon: CATEGORY_ICONS.string,
  tools: [
    caseConverterTool,
    analysisTool,
    reverseTool,
    replaceTool,
    slugifyTool,
    whitespaceTool,
  ],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [caseConverterToolDefinition.id]: caseConverterToolDefinition,
  [analysisToolDefinition.id]: analysisToolDefinition,
  [reverseToolDefinition.id]: reverseToolDefinition,
  [replaceToolDefinition.id]: replaceToolDefinition,
  [slugifyToolDefinition.id]: slugifyToolDefinition,
  [whitespaceToolDefinition.id]: whitespaceToolDefinition,
};
