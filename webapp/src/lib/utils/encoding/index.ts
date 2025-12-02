import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const encodingOperations = {
  base64Encode: (input: string): ToolResult => {
    return wasmWrapper.base64_encode(input);
  },
  base64Decode: (input: string): ToolResult => {
    return wasmWrapper.base64_decode(input);
  },
  urlEncode: (input: string): ToolResult => {
    return wasmWrapper.url_encode(input);
  },
  urlDecode: (input: string): ToolResult => {
    return wasmWrapper.url_decode(input);
  },
  hexEncode: (input: string): ToolResult => {
    return wasmWrapper.hex_encode(input);
  },
  hexDecode: (input: string): ToolResult => {
    return wasmWrapper.hex_decode(input);
  },
};
