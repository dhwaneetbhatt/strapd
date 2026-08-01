import { describe, expect, it, vi } from "vitest";

const wasmMocks = vi.hoisted(() => ({
  randomNumber: vi.fn(() => ({ success: true, result: "pipe output" })),
  stringToUppercase: vi.fn((input: string) => ({
    success: true,
    result: input.toUpperCase(),
  })),
  stringToLowercase: vi.fn((input: string) => ({
    success: true,
    result: input.toLowerCase(),
  })),
  stringToCapitalcase: vi.fn((input: string) => ({
    success: true,
    result: input.replace(/\b\w/g, (character) => character.toUpperCase()),
  })),
  ulidGenerate: vi.fn(() => ({
    success: true,
    result: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })),
  hashMd5: vi.fn(() => ({ success: true, result: "md5-output" })),
  hashSha1: vi.fn(() => ({ success: true, result: "sha1-output" })),
  hashSha256: vi.fn(() => ({ success: true, result: "sha256-output" })),
  hashSha512: vi.fn(() => ({ success: true, result: "sha512-output" })),
  hmacSha256: vi.fn(() => ({ success: true, result: "hmac-sha256-output" })),
  hmacSha512: vi.fn(() => ({ success: true, result: "hmac-sha512-output" })),
}));

vi.mock("../lib/wasm", () => ({
  wasmWrapper: new Proxy(
    {
      random_number: wasmMocks.randomNumber,
      string_to_uppercase: wasmMocks.stringToUppercase,
      string_to_lowercase: wasmMocks.stringToLowercase,
      string_to_capitalcase: wasmMocks.stringToCapitalcase,
      ulid_generate: wasmMocks.ulidGenerate,
      hash_md5: wasmMocks.hashMd5,
      hash_sha1: wasmMocks.hashSha1,
      hash_sha256: wasmMocks.hashSha256,
      hash_sha512: wasmMocks.hashSha512,
      hmac_sha256: wasmMocks.hmacSha256,
      hmac_sha512: wasmMocks.hmacSha512,
    },
    {
      get: (target, property) =>
        Reflect.get(target, property) ??
        vi.fn(() => ({ success: true, result: "pipe output" })),
    },
  ),
}));

import { executePipe } from "../lib/pipes/executor";
import { wasmWrapper } from "../lib/wasm";
import {
  getPipeSourceTools,
  getPipeToolById,
  getPipeTools,
  getPipeTransformTools,
  TOOL_REGISTRY,
} from "./index";

const sampleRuntimeInputs: Record<string, string> = {
  "data-formats-json": '{"b":1,"a":2}',
  "data-formats-xml": "<root><value>1</value></root>",
  "data-formats-converter": '{"value":1}',
  "calculator-unit-converter": "1024",
  "datetime-timestamp": "0",
};

describe("pipe tool contracts", () => {
  it("discovers compatible tools and source/transform subsets automatically", () => {
    const compatible = getPipeTools();
    expect(compatible.length).toBeGreaterThan(0);
    expect(compatible).toEqual(
      Object.values(TOOL_REGISTRY).filter((tool) => tool.pipe),
    );
    expect(
      getPipeSourceTools().every((tool) => tool.pipe?.input.kind === "source"),
    ).toBe(true);
    expect(
      getPipeTransformTools().every(
        (tool) => tool.pipe?.input.kind === "transform",
      ),
    ).toBe(true);
    expect(getPipeToolById("identifier-uuid-generator")).toBeDefined();
  });

  it("declares valid defaults without frozen runtime input keys", () => {
    for (const tool of getPipeTools()) {
      const contract = tool.pipe;
      expect(contract, tool.id).toBeDefined();
      if (!contract) continue;

      expect(contract.validateConfig(contract.defaults), tool.id).toEqual({
        valid: true,
      });
      if (contract.input.kind === "transform") {
        expect(contract.defaults, tool.id).not.toHaveProperty(
          contract.input.key,
        );
        expect(
          contract.config.map(({ id }) => id),
          tool.id,
        ).not.toContain(contract.input.key);
      }
    }
  });

  it("returns each declared canonical string output on success", async () => {
    for (const tool of getPipeTools()) {
      const contract = tool.pipe;
      if (!contract) continue;

      const inputs: Record<string, unknown> = { ...contract.defaults };
      if (contract.input.kind === "transform") {
        inputs[contract.input.key] = sampleRuntimeInputs[tool.id] ?? "hello";
      }
      const result = await tool.operation(inputs);
      expect(result.success, `${tool.id}: ${result.error ?? "failed"}`).toBe(
        true,
      );
      if (result.success) {
        expect(
          typeof (result as Record<string, unknown>)[contract.output.key],
          tool.id,
        ).toBe("string");
      }
    }
  });

  it("validates random generator configs against their backend constraints", () => {
    const randomString = getPipeToolById("random-string")?.pipe;
    const randomNumber = getPipeToolById("random-number")?.pipe;
    expect(randomString).toBeDefined();
    expect(randomNumber).toBeDefined();
    if (!randomString || !randomNumber) return;

    expect(
      randomString.validateConfig({
        ...randomString.defaults,
        length: 256,
      }),
    ).toMatchObject({ valid: false });
    expect(
      randomString.validateConfig({
        ...randomString.defaults,
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      }),
    ).toMatchObject({ valid: false });
    expect(
      randomString.validateConfig({
        ...randomString.defaults,
        length: 3,
      }),
    ).toMatchObject({ valid: false });
    expect(
      randomNumber.validateConfig({
        ...randomNumber.defaults,
        min: 0.5,
      }),
    ).toMatchObject({ valid: false });
    expect(
      randomNumber.validateConfig({
        ...randomNumber.defaults,
        min: 101,
        max: 100,
      }),
    ).toMatchObject({ valid: false });
    expect(
      randomNumber.validateConfig({
        ...randomNumber.defaults,
        min: 0,
        max: 0,
      }),
    ).toEqual({ valid: true });
  });

  it("enforces every declared field validation through the framework", () => {
    for (const tool of getPipeTools()) {
      const contract = tool.pipe;
      if (!contract) continue;

      for (const option of contract.config) {
        for (const validation of option.validations ?? []) {
          const invalidValue =
            validation.rule === "integer"
              ? Number(option.defaultValue) + 0.5
              : "";
          expect(
            contract.validateConfig({
              ...contract.defaults,
              [option.id]: invalidValue,
            }),
            `${tool.id}.${option.id}`,
          ).toMatchObject({ valid: false });
        }
      }
    }
  });

  it("validates compatible unit groups and single-character slug separators declaratively", () => {
    const unitConverter = getPipeToolById("calculator-unit-converter")?.pipe;
    const slugify = getPipeToolById("string-slugify")?.pipe;
    expect(unitConverter?.constraints).toContainEqual(
      expect.objectContaining({ rule: "sameOptionGroup" }),
    );
    expect(
      unitConverter?.validateConfig({ fromUnit: "byte", toUnit: "km" }),
    ).toMatchObject({ valid: false });
    expect(
      unitConverter?.validateConfig({ fromUnit: "s", toUnit: "min" }),
    ).toEqual({ valid: true });

    expect(slugify?.validateConfig({ separator: "" })).toMatchObject({
      valid: false,
    });
    expect(slugify?.validateConfig({ separator: "--" })).toMatchObject({
      valid: false,
    });
    expect(slugify?.validateConfig({ separator: "•" })).toEqual({
      valid: true,
    });
  });

  it("passes a frozen zero maximum to the random number operation", async () => {
    const tool = getPipeToolById("random-number");
    expect(tool).toBeDefined();
    if (!tool) return;
    wasmMocks.randomNumber.mockClear();

    await tool.operation({ min: 0, max: 0, count: 1 });

    expect(wasmWrapper.random_number).toHaveBeenCalledWith(0, 0, 1);
  });

  it("freezes and executes the selected Case Converter output", async () => {
    const caseConverter = getPipeToolById("string-case-converter");
    expect(caseConverter?.pipe?.version).toBe(1);
    expect(caseConverter?.pipe?.config).toContainEqual(
      expect.objectContaining({
        id: "outputCase",
        type: "select",
        defaultValue: "Uppercase",
        options: ["Uppercase", "Lowercase", "Capital case"],
      }),
    );
    const result = await executePipe({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Lowercase ULID",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      steps: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          toolId: "identifier-ulid-generator",
          toolVersion: 1,
          config: { count: 1 },
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          toolId: "string-case-converter",
          toolVersion: 1,
          config: { outputCase: "Lowercase" },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      output: "01arz3ndektsv4rrffq69g5fav",
    });
  });

  it("freezes and executes the selected Hash Generator algorithm", async () => {
    const hashGenerator = getPipeToolById("security-hash");
    expect(hashGenerator?.pipe?.version).toBe(1);
    expect(hashGenerator?.pipe?.config).toContainEqual(
      expect.objectContaining({
        id: "algorithm",
        type: "select",
        defaultValue: "MD5",
        options: ["MD5", "SHA-1", "SHA-256", "SHA-512"],
      }),
    );

    const result = await executePipe(
      {
        id: "44444444-4444-4444-8444-444444444444",
        name: "SHA-256 input",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            toolId: "security-hash",
            toolVersion: 1,
            config: { algorithm: "SHA-256" },
          },
        ],
      },
      "payload",
    );

    expect(result).toEqual({ success: true, output: "sha256-output" });
  });

  it("freezes and executes the selected HMAC Generator algorithm", async () => {
    const hmacGenerator = getPipeToolById("security-hmac");
    expect(hmacGenerator?.pipe?.version).toBe(1);
    expect(hmacGenerator?.pipe?.config).toContainEqual(
      expect.objectContaining({
        id: "algorithm",
        type: "select",
        defaultValue: "SHA-256",
        options: ["SHA-256", "SHA-512"],
      }),
    );

    const result = await executePipe(
      {
        id: "66666666-6666-4666-8666-666666666666",
        name: "SHA-512 HMAC",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: "77777777-7777-4777-8777-777777777777",
            toolId: "security-hmac",
            toolVersion: 1,
            config: { key: "secret", algorithm: "SHA-512" },
          },
        ],
      },
      "payload",
    );

    expect(result).toEqual({ success: true, output: "hmac-sha512-output" });
  });
});
