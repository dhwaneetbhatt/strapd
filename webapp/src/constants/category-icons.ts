// Centralized category icon mapping
// Used across command palette, tool interface, and other components
export const CATEGORY_ICONS = {
  string: "📝",
  encoding: "🔄",
  security: "🔐",
  dataFormats: "📋",
  identifiers: "🆔",
  datetime: "⏰",
  random: "🎲",
} as const;

export type CategoryKey = keyof typeof CATEGORY_ICONS;

// Helper function to get category icon with fallback
export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category as CategoryKey] || "🔧";
};
