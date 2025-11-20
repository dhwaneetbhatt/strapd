// Export all string operations
import { stringAnalysisOperations } from "./analysis";
import { stringCaseOperations } from "./case";
import { stringTransformOperations } from "./transform";
import { stringWhitespaceOperations } from "./whitespace";

// Re-export for convenience
export const stringUtils = {
  case: stringCaseOperations,
  analysis: stringAnalysisOperations,
  transform: stringTransformOperations,
  whitespace: stringWhitespaceOperations,
};

// Also export individual operations
export {
  stringCaseOperations,
  stringAnalysisOperations,
  stringTransformOperations,
  stringWhitespaceOperations,
};
