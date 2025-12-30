import { beforeEach, describe, expect, it, vi } from "vitest";
import { wasmWrapper } from "../../wasm";
import { dataFormatsOperations, detectFormat } from "./index";

const mockedWasm = vi.mocked(wasmWrapper);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("detectFormat", () => {
  describe("JSON Detection", () => {
    it("detects JSON from object", () => {
      expect(detectFormat('{"key": "value"}')).toBe("json");
    });

    it("detects JSON from array", () => {
      expect(detectFormat("[1, 2, 3]")).toBe("json");
    });

    it("detects JSON with whitespace", () => {
      expect(detectFormat('  \n{"key": "value"}')).toBe("json");
    });

    it("detects empty JSON array", () => {
      expect(detectFormat("[]")).toBe("json");
    });

    it("detects empty JSON object", () => {
      expect(detectFormat("{}")).toBe("json");
    });
  });

  describe("XML Detection", () => {
    it("detects XML from element", () => {
      expect(detectFormat("<root>content</root>")).toBe("xml");
    });

    it("detects XML from self-closing tag", () => {
      expect(detectFormat("<root />")).toBe("xml");
    });

    it("detects XML declaration", () => {
      expect(detectFormat("<?xml version='1.0'?>")).toBe("xml");
    });

    it("detects XML with attributes", () => {
      expect(detectFormat('<root attr="value">content</root>')).toBe("xml");
    });

    it("detects XML with whitespace", () => {
      expect(detectFormat("  \n<root>content</root>")).toBe("xml");
    });
  });

  describe("YAML Detection", () => {
    it("detects YAML from key-value", () => {
      expect(detectFormat("key: value")).toBe("yaml");
    });

    it("detects YAML with hyphenated key", () => {
      expect(detectFormat("api-key: secret")).toBe("yaml");
    });

    it("detects YAML with underscore key", () => {
      expect(detectFormat("api_key: secret")).toBe("yaml");
    });

    it("detects YAML with whitespace", () => {
      expect(detectFormat("  \nkey: value")).toBe("yaml");
    });

    it("does not confuse JSON-like YAML", () => {
      expect(detectFormat("{key: value}")).toBe("json");
    });
  });

  describe("Unknown Format", () => {
    it("returns unknown for empty string", () => {
      expect(detectFormat("")).toBe("unknown");
    });

    it("returns unknown for whitespace only", () => {
      expect(detectFormat("   \n\t  ")).toBe("unknown");
    });

    it("returns unknown for plain text", () => {
      expect(detectFormat("this is plain text")).toBe("unknown");
    });

    it("returns unknown for numbers", () => {
      expect(detectFormat("12345")).toBe("unknown");
    });
  });

  describe("Edge Cases", () => {
    it("handles Unicode in JSON", () => {
      expect(detectFormat('{"name": "José"}')).toBe("json");
    });

    it("handles Unicode in XML", () => {
      expect(detectFormat("<name>José</name>")).toBe("xml");
    });

    it("handles tabs", () => {
      expect(detectFormat('\t\t{"key": "value"}')).toBe("json");
    });

    it("detects consistently", () => {
      const input = '{"test": [1, 2, 3]}';
      expect(detectFormat(input)).toBe("json");
      expect(detectFormat(input)).toBe("json");
    });
  });
});

describe("dataFormatsOperations.convert", () => {
  describe("Same Format Conversions", () => {
    describe("JSON to JSON", () => {
      it("beautifies by default", () => {
        const input = '{"a":1}';
        const result = dataFormatsOperations.convert(input, "json", "json");
        expect(result.success).toBe(true);
        expect(mockedWasm.json_beautify).toHaveBeenCalledWith(input, false, 2);
        expect(mockedWasm.json_minify).not.toHaveBeenCalled();
      });

      it("minifies when minify=true", () => {
        const input = '{\n  "a": 1\n}';
        const result = dataFormatsOperations.convert(input, "json", "json", {
          minify: true,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.json_minify).toHaveBeenCalledWith(input, false);
        expect(mockedWasm.json_beautify).not.toHaveBeenCalled();
      });
    });

    describe("XML to XML", () => {
      it("beautifies by default", () => {
        const input = "<root><item>value</item></root>";
        const result = dataFormatsOperations.convert(input, "xml", "xml");
        expect(result.success).toBe(true);
        expect(mockedWasm.xml_beautify).toHaveBeenCalledWith(input, 2);
        expect(mockedWasm.xml_minify).not.toHaveBeenCalled();
      });

      it("minifies when minify=true", () => {
        const input = "<root>\n  <item>value</item>\n</root>";
        const result = dataFormatsOperations.convert(input, "xml", "xml", {
          minify: true,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.xml_minify).toHaveBeenCalledWith(input);
        expect(mockedWasm.xml_beautify).not.toHaveBeenCalled();
      });
    });
  });

  describe("Cross Format Conversions", () => {
    describe("JSON to YAML", () => {
      it("converts successfully", () => {
        const input = '{"key":"value"}';
        const result = dataFormatsOperations.convert(input, "json", "yaml");
        expect(result.success).toBe(true);
        expect(result.result).toBe("key: value");
        expect(mockedWasm.json_to_yaml).toHaveBeenCalledWith(input);
      });
    });

    describe("YAML to JSON", () => {
      it("converts and beautifies by default", () => {
        const input = "key: value";
        const result = dataFormatsOperations.convert(input, "yaml", "json");
        expect(result.success).toBe(true);
        expect(result.result).toContain("key");
        expect(mockedWasm.yaml_to_json).toHaveBeenCalledWith(input);
        expect(mockedWasm.json_beautify).toHaveBeenCalled();
      });

      it("skips beautification when minify=true", () => {
        const input = "key: value";
        const result = dataFormatsOperations.convert(input, "yaml", "json", {
          minify: true,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.yaml_to_json).toHaveBeenCalledWith(input);
        expect(mockedWasm.json_beautify).not.toHaveBeenCalled();
      });
    });

    describe("JSON to XML", () => {
      it("converts successfully", () => {
        const input = '{"user":"Bob"}';
        const result = dataFormatsOperations.convert(input, "json", "xml");
        expect(result.success).toBe(true);
        expect(mockedWasm.json_to_xml).toHaveBeenCalledWith(input, null);
      });

      it("passes rootName option", () => {
        const input = '{"user":"Bob"}';
        const result = dataFormatsOperations.convert(input, "json", "xml", {
          rootName: "data",
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.json_to_xml).toHaveBeenCalledWith(input, "data");
      });

      it("beautifies by default", () => {
        const input = '{"user":"Bob"}';
        const result = dataFormatsOperations.convert(input, "json", "xml", {
          minify: false,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.json_to_xml).toHaveBeenCalled();
        expect(mockedWasm.xml_beautify).toHaveBeenCalled();
      });

      it("skips beautification when minify=true", () => {
        const input = '{"user":"Bob"}';
        const result = dataFormatsOperations.convert(input, "json", "xml", {
          minify: true,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.json_to_xml).toHaveBeenCalled();
        expect(mockedWasm.xml_beautify).not.toHaveBeenCalled();
      });
    });

    describe("XML to JSON", () => {
      it("converts successfully", () => {
        const input = "<root><item>value</item></root>";
        const result = dataFormatsOperations.convert(input, "xml", "json");
        expect(result.success).toBe(true);
        expect(mockedWasm.xml_to_json).toHaveBeenCalledWith(input);
      });

      it("beautifies by default", () => {
        const input = "<root><item>value</item></root>";
        const result = dataFormatsOperations.convert(input, "xml", "json", {
          minify: false,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.xml_to_json).toHaveBeenCalled();
        expect(mockedWasm.json_beautify).toHaveBeenCalled();
      });

      it("skips beautification when minify=true", () => {
        const input = "<root><item>value</item></root>";
        const result = dataFormatsOperations.convert(input, "xml", "json", {
          minify: true,
        });
        expect(result.success).toBe(true);
        expect(mockedWasm.xml_to_json).toHaveBeenCalled();
        expect(mockedWasm.json_beautify).not.toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("returns error for unknown source format", () => {
      const result = dataFormatsOperations.convert("input", "unknown", "json");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("returns error for unsupported conversion", () => {
      const result = dataFormatsOperations.convert("input", "json", "unknown");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe("dataFormatsOperations individual functions", () => {
  it("jsonBeautify calls WASM with correct parameters", () => {
    const input = '{"a":1}';
    const result = dataFormatsOperations.jsonBeautify(input, false, 2);
    expect(result.success).toBe(true);
    expect(mockedWasm.json_beautify).toHaveBeenCalledWith(input, false, 2);
  });

  it("jsonMinify calls WASM with correct parameters", () => {
    const input = '{\n  "a": 1\n}';
    const result = dataFormatsOperations.jsonMinify(input, false);
    expect(result.success).toBe(true);
    expect(mockedWasm.json_minify).toHaveBeenCalledWith(input, false);
  });

  it("xmlBeautify calls WASM with correct parameters", () => {
    const input = "<root><item /></root>";
    const result = dataFormatsOperations.xmlBeautify(input, 2);
    expect(result.success).toBe(true);
    expect(mockedWasm.xml_beautify).toHaveBeenCalledWith(input, 2);
  });

  it("xmlMinify calls WASM with correct parameters", () => {
    const input = "<root>\n  <item />\n</root>";
    const result = dataFormatsOperations.xmlMinify(input);
    expect(result.success).toBe(true);
    expect(mockedWasm.xml_minify).toHaveBeenCalledWith(input);
  });

  it("jsonToYaml calls WASM with correct parameters", () => {
    const input = '{"key":"value"}';
    const result = dataFormatsOperations.jsonToYaml(input);
    expect(result.success).toBe(true);
    expect(mockedWasm.json_to_yaml).toHaveBeenCalledWith(input);
  });

  it("yamlToJson calls WASM with correct parameters", () => {
    const input = "key: value";
    const result = dataFormatsOperations.yamlToJson(input);
    expect(result.success).toBe(true);
    expect(mockedWasm.yaml_to_json).toHaveBeenCalledWith(input);
  });

  it("jsonToXml without root calls WASM with null", () => {
    const input = '{"data":"value"}';
    const result = dataFormatsOperations.jsonToXml(input);
    expect(result.success).toBe(true);
    expect(mockedWasm.json_to_xml).toHaveBeenCalledWith(input, null);
  });

  it("jsonToXml with root calls WASM with root name", () => {
    const input = '{"data":"value"}';
    const result = dataFormatsOperations.jsonToXml(input, "custom");
    expect(result.success).toBe(true);
    expect(mockedWasm.json_to_xml).toHaveBeenCalledWith(input, "custom");
  });

  it("xmlToJson calls WASM with correct parameters", () => {
    const input = "<root><item>value</item></root>";
    const result = dataFormatsOperations.xmlToJson(input);
    expect(result.success).toBe(true);
    expect(mockedWasm.xml_to_json).toHaveBeenCalledWith(input);
  });
});
