import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const stringWhitespaceOperations = {
  trim: (input: string, left = true, right = true, all = false): ToolResult => {
    return wasmWrapper.string_trim(input, left, right, all);
  },
};
