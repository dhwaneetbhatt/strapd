/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateToolScore,
  createInitialState,
  deserializeState,
  getTopToolIds,
  serializeState,
  sortToolsByUsage,
  type ToolUsageData,
  updateToolUsage,
} from "./tool-usage";

describe("tool-usage utilities", () => {
  beforeEach(() => {
    // Mock Date.now() for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateToolScore", () => {
    it("should calculate score with 70% frequency and 30% recency", () => {
      const usage: ToolUsageData = {
        toolId: "test-tool",
        count: 10,
        lastUsed: Date.now(),
      };
      const maxCount = 10;

      const score = calculateToolScore(usage, maxCount);

      expect(score).toBe(1.0);
    });

    it("should prioritize frequency over recency (70/30 split)", () => {
      const highFreqOld: ToolUsageData = {
        toolId: "high-freq-old",
        count: 10,
        lastUsed: Date.now() - 30 * 24 * 60 * 60 * 1000,
      };

      const lowFreqRecent: ToolUsageData = {
        toolId: "low-freq-recent",
        count: 2,
        lastUsed: Date.now(),
      };

      const maxCount = 10;

      const highFreqScore = calculateToolScore(highFreqOld, maxCount);
      const lowFreqScore = calculateToolScore(lowFreqRecent, maxCount);

      expect(highFreqScore).toBeGreaterThan(lowFreqScore);
    });

    it("should handle maxCount = 0 edge case", () => {
      const usage: ToolUsageData = {
        toolId: "test-tool",
        count: 5,
        lastUsed: Date.now(),
      };

      const score = calculateToolScore(usage, 0);

      // When maxCount is 0, frequency score should be 0, only recency matters
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(0.3); // Only recency component (30%)
    });
  });

  describe("createInitialState", () => {
    it("should create empty state", () => {
      const state = createInitialState();

      expect(state.usageMap.size).toBe(0);
      expect(state.sortedToolIds).toEqual([]);
      expect(state.sortedToolIds.slice(0, 5)).toEqual([]);
    });
  });

  describe("updateToolUsage", () => {
    it("should add new tool and precompute sorted arrays", () => {
      const state = createInitialState();
      const updated = updateToolUsage(state, "new-tool");

      expect(updated.usageMap.size).toBe(1);
      expect(updated.usageMap.get("new-tool")).toEqual({
        toolId: "new-tool",
        count: 1,
        lastUsed: Date.now(),
      });

      // Precomputed arrays should be updated
      expect(updated.sortedToolIds).toEqual(["new-tool"]);
      expect(updated.sortedToolIds.slice(0, 5)).toEqual(["new-tool"]);
    });

    it("should increment count and recompute sorted arrays", () => {
      let state = createInitialState();
      state = updateToolUsage(state, "tool1");
      state = updateToolUsage(state, "tool2");
      state = updateToolUsage(state, "tool1"); // Use tool1 again

      expect(state.usageMap.get("tool1")?.count).toBe(2);
      expect(state.usageMap.get("tool2")?.count).toBe(1);

      // tool1 should be first (higher count)
      expect(state.sortedToolIds[0]).toBe("tool1");
      expect(state.sortedToolIds.slice(0, 5)[0]).toBe("tool1");
    });

    it("should track many tools and maintain sorted order", () => {
      let state = createInitialState();

      // Add 10 tools with different usage counts
      for (let i = 1; i <= 10; i++) {
        for (let j = 0; j < i; j++) {
          state = updateToolUsage(state, `tool${i}`);
        }
      }

      expect(state.usageMap.size).toBe(10);
      // tool10 should be first (used 10 times)
      expect(state.sortedToolIds[0]).toBe("tool10");
      // tool1 should be last (used 1 time)
      expect(state.sortedToolIds[9]).toBe("tool1");

      // Top 5 should be tool10, tool9, tool8, tool7, tool6
      expect(state.sortedToolIds.slice(0, 5)).toEqual([
        "tool10",
        "tool9",
        "tool8",
        "tool7",
        "tool6",
      ]);
    });

    it("should not mutate original state", () => {
      const state = createInitialState();
      const originalSize = state.usageMap.size;

      updateToolUsage(state, "new-tool");

      expect(state.usageMap.size).toBe(originalSize);
    });
  });

  describe("getTopToolIds", () => {
    it("should return precomputed top 5 for default limit", () => {
      let state = createInitialState();

      for (let i = 1; i <= 10; i++) {
        for (let j = 0; j < i; j++) {
          state = updateToolUsage(state, `tool${i}`);
        }
      }

      const result = getTopToolIds(state);

      // Should slice the precomputed array
      expect(result).toEqual(state.sortedToolIds.slice(0, 5));
      expect(result).toHaveLength(5);
    });

    it("should return empty array for empty state", () => {
      const state = createInitialState();
      const result = getTopToolIds(state);

      expect(result).toEqual([]);
    });

    it("should handle custom limits", () => {
      let state = createInitialState();

      for (let i = 1; i <= 10; i++) {
        state = updateToolUsage(state, `tool${i}`);
      }

      const result = getTopToolIds(state, 3);

      expect(result).toHaveLength(3);
    });
  });

  describe("sortToolsByUsage", () => {
    interface TestTool {
      id: string;
      name: string;
    }

    it("should return original array if no usage data", () => {
      const tools: TestTool[] = [
        { id: "tool1", name: "Tool 1" },
        { id: "tool2", name: "Tool 2" },
      ];
      const state = createInitialState();

      const result = sortToolsByUsage(tools, state);

      expect(result).toEqual(tools);
    });

    it("should sort tools based on precomputed order", () => {
      const tools: TestTool[] = [
        { id: "tool1", name: "Tool 1" },
        { id: "tool2", name: "Tool 2" },
        { id: "tool3", name: "Tool 3" },
      ];

      let state = createInitialState();
      // Use tools in different amounts
      state = updateToolUsage(state, "tool2"); // 1
      state = updateToolUsage(state, "tool2"); // 2
      state = updateToolUsage(state, "tool1"); // 1
      state = updateToolUsage(state, "tool3"); // 1
      state = updateToolUsage(state, "tool3"); // 2
      state = updateToolUsage(state, "tool3"); // 3

      const result = sortToolsByUsage(tools, state);

      // tool3 (3), tool2 (2), tool1 (1)
      expect(result.map((t) => t.id)).toEqual(["tool3", "tool2", "tool1"]);
    });

    it("should place untracked tools at the end", () => {
      const tools: TestTool[] = [
        { id: "tracked1", name: "Tracked 1" },
        { id: "untracked", name: "Untracked" },
        { id: "tracked2", name: "Tracked 2" },
      ];

      let state = createInitialState();
      state = updateToolUsage(state, "tracked1");
      state = updateToolUsage(state, "tracked2");
      state = updateToolUsage(state, "tracked2");

      const result = sortToolsByUsage(tools, state);

      expect(result.map((t) => t.id)).toEqual([
        "tracked2",
        "tracked1",
        "untracked",
      ]);
    });

    it("should not mutate original array", () => {
      const tools: TestTool[] = [
        { id: "tool1", name: "Tool 1" },
        { id: "tool2", name: "Tool 2" },
      ];

      let state = createInitialState();
      state = updateToolUsage(state, "tool2");

      const original = [...tools];
      sortToolsByUsage(tools, state);

      expect(tools).toEqual(original);
    });

    it("should handle when sortedToolIds contains tools not in input array", () => {
      const tools: TestTool[] = [
        { id: "tool1", name: "Tool 1" },
        { id: "tool3", name: "Tool 3" },
      ];

      let state = createInitialState();
      state = updateToolUsage(state, "tool1");
      state = updateToolUsage(state, "tool2"); // tool2 not in tools array
      state = updateToolUsage(state, "tool3");

      const result = sortToolsByUsage(tools, state);

      // Should only include tools that exist in input array, in usage order
      // tool1 used once, tool3 used once, but tool1 was used first
      expect(result.map((t) => t.id)).toEqual(["tool1", "tool3"]);
      expect(result).toHaveLength(2);
    });
  });

  describe("serializeState and deserializeState", () => {
    it("should serialize and deserialize state correctly", () => {
      let state = createInitialState();
      state = updateToolUsage(state, "tool1");
      state = updateToolUsage(state, "tool2");
      state = updateToolUsage(state, "tool1");

      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      expect(deserialized.usageMap.size).toBe(state.usageMap.size);
      expect(deserialized.sortedToolIds).toEqual(state.sortedToolIds);
      expect(deserialized.sortedToolIds.slice(0, 5)).toEqual(
        state.sortedToolIds.slice(0, 5),
      );
      expect(deserialized.usageMap.get("tool1")).toEqual(
        state.usageMap.get("tool1"),
      );
    });

    it("should handle empty state", () => {
      const state = createInitialState();
      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      expect(deserialized.usageMap.size).toBe(0);
      expect(deserialized.sortedToolIds).toEqual([]);
      expect(deserialized.sortedToolIds.slice(0, 5)).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
      const deserialized = deserializeState("invalid json");

      expect(deserialized.usageMap.size).toBe(0);
      expect(deserialized.sortedToolIds).toEqual([]);
      expect(deserialized.sortedToolIds.slice(0, 5)).toEqual([]);
    });

    it("should preserve precomputed data across serialization", () => {
      let state = createInitialState();

      for (let i = 1; i <= 10; i++) {
        for (let j = 0; j < i; j++) {
          state = updateToolUsage(state, `tool${i}`);
        }
      }

      const serialized = serializeState(state);
      const deserialized = deserializeState(serialized);

      // Precomputed arrays should be preserved
      expect(deserialized.sortedToolIds).toEqual(state.sortedToolIds);
      expect(deserialized.sortedToolIds.slice(0, 5)).toEqual(
        state.sortedToolIds.slice(0, 5),
      );
      expect(deserialized.sortedToolIds.slice(0, 5)).toHaveLength(5);
    });

    it("should handle missing usage field in JSON", () => {
      const json = JSON.stringify({ sorted: ["tool1", "tool2"] });
      const deserialized = deserializeState(json);

      expect(deserialized.usageMap.size).toBe(0);
      expect(deserialized.sortedToolIds).toEqual(["tool1", "tool2"]);
    });

    it("should handle missing sorted field in JSON", () => {
      const json = JSON.stringify({
        usage: [
          { toolId: "tool1", count: 5, lastUsed: Date.now() },
          { toolId: "tool2", count: 3, lastUsed: Date.now() },
        ],
      });
      const deserialized = deserializeState(json);

      expect(deserialized.usageMap.size).toBe(2);
      expect(deserialized.sortedToolIds).toEqual([]);
    });
  });
});
