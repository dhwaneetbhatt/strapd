export interface ToolUsageData {
  toolId: string;
  count: number;
  lastUsed: number;
}

/**
 * Precomputed usage state for O(1) reads
 * All heavy computation is done during writes
 */
export interface ToolUsageState {
  // Raw usage data
  usageMap: Map<string, ToolUsageData>;
  // Precomputed: sorted array of all tool IDs by score (highest first)
  sortedToolIds: string[];
}

/**
 * Calculate usage score for a tool based on frequency and recency
 * @param usage - Tool usage data containing count and lastUsed timestamp
 * @param maxCount - Maximum count among all tools (for normalization)
 * @returns Score between 0 and 1 (70% frequency, 30% recency)
 */
export const calculateToolScore = (
  usage: ToolUsageData,
  maxCount: number,
): number => {
  const frequencyScore = maxCount > 0 ? usage.count / maxCount : 0;
  const daysSinceLastUse =
    (Date.now() - usage.lastUsed) / (1000 * 60 * 60 * 24);
  const recencyScore = 1 / (1 + daysSinceLastUse);
  return frequencyScore * 0.7 + recencyScore * 0.3;
};

/**
 * Compute sorted tool IDs from usage map
 * This is the heavy lifting done during writes
 */
const computeSortedToolIds = (
  usageMap: Map<string, ToolUsageData>,
): string[] => {
  if (usageMap.size === 0) return [];

  const usageArray = Array.from(usageMap.values());
  const maxCount = Math.max(...usageArray.map((u) => u.count));

  return usageArray
    .map((usage) => ({
      toolId: usage.toolId,
      score: calculateToolScore(usage, maxCount),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.toolId);
};

/**
 * Update tool usage data with a new usage event
 * WRITE PATH: Does all heavy computation here for O(1) reads
 * @param currentState - Current usage state
 * @param toolId - ID of the tool being used
 * @returns New state with precomputed sorted arrays
 */
export const updateToolUsage = (
  currentState: ToolUsageState,
  toolId: string,
): ToolUsageState => {
  // Update the usage map
  const newMap = new Map(currentState.usageMap);
  const existing = newMap.get(toolId);

  if (existing) {
    newMap.set(toolId, {
      toolId,
      count: existing.count + 1,
      lastUsed: Date.now(),
    });
  } else {
    newMap.set(toolId, {
      toolId,
      count: 1,
      lastUsed: Date.now(),
    });
  }

  // HEAVY LIFTING: Precompute sorted array (done on write)
  const sortedToolIds = computeSortedToolIds(newMap);

  return {
    usageMap: newMap,
    sortedToolIds,
  };
};

/**
 * Get the top N frequently used tool IDs
 * @param state - Precomputed usage state
 * @param limit - Maximum number of tools to return (default: 5)
 * @returns Array of tool IDs sorted by score (highest first)
 */
export const getTopToolIds = (state: ToolUsageState, limit = 5): string[] => {
  // O(1) - just slice the precomputed array
  return state.sortedToolIds.slice(0, limit);
};

/**
 * Sort tools by usage score, placing untracked tools at the end
 * @param tools - Array of tools to sort
 * @param state - Precomputed usage state
 * @returns Sorted array of tools
 */
export const sortToolsByUsage = <T extends { id: string }>(
  tools: T[],
  state: ToolUsageState,
): T[] => {
  if (state.sortedToolIds.length === 0) return tools;

  // Create lookup map: toolId -> tool object
  const toolMap = new Map<string, T>();
  const untrackedTools: T[] = [];

  for (const tool of tools) {
    if (state.sortedToolIds.includes(tool.id)) {
      toolMap.set(tool.id, tool);
    } else {
      untrackedTools.push(tool);
    }
  }

  // Build result array from precomputed order
  const result: T[] = [];
  for (const toolId of state.sortedToolIds) {
    const tool = toolMap.get(toolId);
    if (tool) {
      result.push(tool);
    }
  }

  // Append untracked tools at the end
  return [...result, ...untrackedTools];
};

/**
 * Create initial empty state
 */
export const createInitialState = (): ToolUsageState => ({
  usageMap: new Map(),
  sortedToolIds: [],
});

/**
 * Serialize state for localStorage
 */
export const serializeState = (state: ToolUsageState): string => {
  return JSON.stringify({
    usage: Array.from(state.usageMap.values()),
    sorted: state.sortedToolIds,
  });
};

/**
 * Deserialize state from localStorage
 */
export const deserializeState = (json: string): ToolUsageState => {
  try {
    const data = JSON.parse(json);
    const usageMap = new Map<string, ToolUsageData>();

    (data.usage || []).forEach((item: ToolUsageData) => {
      usageMap.set(item.toolId, item);
    });

    return {
      usageMap,
      sortedToolIds: data.sorted || [],
    };
  } catch {
    return createInitialState();
  }
};
