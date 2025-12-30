import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock WASM module globally to avoid import issues in tests
vi.mock("../lib/wasm", () => ({
  wasmWrapper: {
    json_beautify: vi.fn((input, _sort, spaces) => ({
      success: true,
      result: JSON.stringify(JSON.parse(input), null, spaces),
    })),
    json_minify: vi.fn((input) => ({
      success: true,
      result: JSON.stringify(JSON.parse(input)),
    })),
    xml_beautify: vi.fn((input) => ({
      success: true,
      result: input.replace(/></g, ">\n<"),
    })),
    xml_minify: vi.fn((input) => ({
      success: true,
      result: input.replace(/>\s+</g, "><"),
    })),
    json_to_yaml: vi.fn(() => ({
      success: true,
      result: "key: value",
    })),
    yaml_to_json: vi.fn(() => ({
      success: true,
      result: '{"key":"value"}',
    })),
    json_to_xml: vi.fn((input) => ({
      success: true,
      result: `<root>${input}</root>`,
    })),
    xml_to_json: vi.fn(() => ({
      success: true,
      result: '{"root":{"text":"content"}}',
    })),
  },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});
