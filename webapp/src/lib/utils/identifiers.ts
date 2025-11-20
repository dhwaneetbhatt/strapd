import type { ToolResult } from "../../types";
import { wasmWrapper } from "../wasm";

export const identifierOperations = {
  uuidV4: (count: number): ToolResult => {
    return wasmWrapper.uuid_generate_v4(count);
  },
  uuidV7: (count: number): ToolResult => {
    return wasmWrapper.uuid_generate_v7(count);
  },
};
