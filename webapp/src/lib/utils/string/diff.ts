import { wasmWrapper } from "../../wasm";

export const DEFAULT_DIFF_CONTEXT = 3;
export const FULL_DIFF_CONTEXT = 0xffffffff;

export const stringDiffOperations = {
  compare: (from: string, to: string, context = DEFAULT_DIFF_CONTEXT) =>
    wasmWrapper.text_diff(from, to, context),
  unified: (from: string, to: string, context = DEFAULT_DIFF_CONTEXT) =>
    wasmWrapper.text_diff_unified(from, to, context, "original", "changed"),
};
