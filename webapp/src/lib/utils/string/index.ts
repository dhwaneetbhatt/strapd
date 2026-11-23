// Export all string operations
import { stringAnalysisOperations } from "./analysis";
import { stringCaseOperations } from "./case";
import { stringDiffOperations } from "./diff";
import { stringTransformOperations } from "./transform";
import { stringWhitespaceOperations } from "./whitespace";

// Re-export for convenience
export const stringUtils = {
  case: stringCaseOperations,
  diff: stringDiffOperations,
  analysis: stringAnalysisOperations,
  transform: stringTransformOperations,
  whitespace: stringWhitespaceOperations,
};

// Also export individual operations
export {
  stringAnalysisOperations,
  stringCaseOperations,
  stringTransformOperations,
  stringWhitespaceOperations,
};
