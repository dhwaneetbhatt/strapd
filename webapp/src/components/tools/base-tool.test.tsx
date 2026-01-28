import { ChakraProvider } from "@chakra-ui/react";
import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { ToolResult } from "../../types";
import type { ToolDefinition } from "./base-tool";
import { useBaseTool } from "./base-tool";

// Mock dependencies
vi.mock("../../hooks/use-keyboard", () => ({
  useCommandS: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe("useBaseTool", () => {
  let mockTool: ToolDefinition;
  let mockOperation: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOperation = vi.fn();

    mockTool = {
      id: "test-tool",
      name: "Test Tool",
      description: "A test tool",
      category: "string",
      component: () => null,
      operation: mockOperation,
    };
  });

  describe("Initial State", () => {
    it("initializes with empty state", () => {
      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      expect(result.current.inputs).toEqual({});
      expect(result.current.outputs).toEqual({});
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it("initializes with provided initialInputs", () => {
      const initialInputs = { input1: "value1" };
      const { result } = renderHook(
        () => useBaseTool(mockTool, initialInputs),
        {
          wrapper,
        },
      );

      expect(result.current.inputs).toEqual(initialInputs);
    });
  });

  describe("updateInput", () => {
    it("updates input values", () => {
      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      act(() => {
        result.current.updateInput("key1", "value1");
      });

      expect(result.current.inputs).toEqual({ key1: "value1" });
    });

    it("updates multiple inputs", () => {
      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      act(() => {
        result.current.updateInput("key1", "value1");
      });
      act(() => {
        result.current.updateInput("key2", "value2");
      });

      expect(result.current.inputs).toEqual({ key1: "value1", key2: "value2" });
    });

    it("calls onInputChange callback", () => {
      const onInputChange = vi.fn();
      const { result } = renderHook(
        () => useBaseTool(mockTool, undefined, onInputChange),
        { wrapper },
      );

      act(() => {
        result.current.updateInput("key1", "value1");
      });

      expect(onInputChange).toHaveBeenCalledWith({ key1: "value1" });
    });
  });

  describe("processInputs", () => {
    it("processes inputs successfully", async () => {
      const successResult: ToolResult = {
        success: true,
        result: "processed",
      };
      mockOperation.mockResolvedValue(successResult);

      const { result } = renderHook(
        () => useBaseTool(mockTool, { input: "test" }),
        {
          wrapper,
        },
      );

      await act(async () => {
        await result.current.processInputs();
      });

      expect(mockOperation).toHaveBeenCalledWith({ input: "test" });
      expect(result.current.outputs).toEqual(successResult);
      expect(result.current.error).toBeUndefined();
      expect(result.current.isProcessing).toBe(false);
    });

    it("sets isProcessing during operation", async () => {
      mockOperation.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, result: "done" }), 50),
          ),
      );

      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      act(() => {
        result.current.processInputs();
      });

      expect(result.current.isProcessing).toBe(true);

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it("handles operation errors", async () => {
      const errorResult: ToolResult = {
        success: false,
        error: "Operation failed",
      };
      mockOperation.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      await act(async () => {
        await result.current.processInputs();
      });

      expect(result.current.outputs).toEqual({});
      expect(result.current.error).toBe("Operation failed");
      expect(result.current.isProcessing).toBe(false);
    });

    it("handles thrown errors", async () => {
      mockOperation.mockRejectedValue(new Error("Unexpected error"));

      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      await act(async () => {
        await result.current.processInputs();
      });

      expect(result.current.error).toBe("Unexpected error");
      expect(result.current.isProcessing).toBe(false);
    });

    it("handles non-Error exceptions", async () => {
      mockOperation.mockRejectedValue("String error");

      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      await act(async () => {
        await result.current.processInputs();
      });

      expect(result.current.error).toBe("Unknown error occurred");
    });

    it("clears previous error on new processing", async () => {
      mockOperation.mockResolvedValueOnce({
        success: false,
        error: "First error",
      });

      const { result } = renderHook(() => useBaseTool(mockTool), { wrapper });

      await act(async () => {
        await result.current.processInputs();
      });
      expect(result.current.error).toBe("First error");

      mockOperation.mockResolvedValueOnce({ success: true, result: "ok" });

      await act(async () => {
        await result.current.processInputs();
      });

      expect(result.current.error).toBeUndefined();
    });
  });

  describe("clearAll", () => {
    it("clears inputs, outputs, and errors", async () => {
      const { result } = renderHook(
        () => useBaseTool(mockTool, { input: "value" }),
        {
          wrapper,
        },
      );

      mockOperation.mockResolvedValue({ success: true, result: "output" });

      await act(async () => {
        await result.current.processInputs();
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.inputs).toEqual({});
      expect(result.current.outputs).toEqual({});
      expect(result.current.error).toBeUndefined();
      expect(result.current.isProcessing).toBe(false);
    });

    it("calls onInputChange with empty object", () => {
      const onInputChange = vi.fn();
      const { result } = renderHook(
        () => useBaseTool(mockTool, { key: "value" }, onInputChange),
        { wrapper },
      );

      act(() => {
        result.current.clearAll();
      });

      expect(onInputChange).toHaveBeenCalledWith({});
    });
  });

  describe("initialInputs reactivity", () => {
    it("updates when initialInputs change", () => {
      const { result, rerender } = renderHook(
        ({ initialInputs }) => useBaseTool(mockTool, initialInputs),
        {
          wrapper,
          initialProps: { initialInputs: { key1: "value1" } },
        },
      );

      expect(result.current.inputs).toEqual({ key1: "value1" });

      rerender({ initialInputs: { key1: "value2" } });

      expect(result.current.inputs.key1).toBe("value2");
    });

    it("merges new initialInputs with existing state", () => {
      const { result, rerender } = renderHook(
        ({ initialInputs }) => useBaseTool(mockTool, initialInputs),
        {
          wrapper,
          initialProps: {
            initialInputs: { key1: "value1" } as Record<string, unknown>,
          },
        },
      );

      act(() => {
        result.current.updateInput("key2", "value2");
      });

      expect(result.current.inputs).toEqual({ key1: "value1", key2: "value2" });

      rerender({
        initialInputs: { key1: "updated" } as Record<string, unknown>,
      });

      // key1 should be updated, key2 should be preserved
      expect(result.current.inputs.key1).toBe("updated");
      expect(result.current.inputs.key2).toBe("value2");
    });
  });
});
