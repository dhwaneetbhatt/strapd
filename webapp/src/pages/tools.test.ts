import { describe, expect, it } from "vitest";
import { inputsFromSearchParams, shareableToolInputs } from "./tools";

describe("JWT tool URL state", () => {
  const sensitiveInputs = new Set(["secret"]);

  it("does not hydrate a secret supplied in the query string", () => {
    const inputs = inputsFromSearchParams(
      new URLSearchParams(
        "token=a.b.c&secret=do-not-load&includeAnalysis=true",
      ),
      sensitiveInputs,
    );

    expect(inputs).toEqual({ token: "a.b.c", includeAnalysis: true });
  });

  it("does not serialize a secret while preserving shareable state", () => {
    expect(
      shareableToolInputs(
        {
          payload: '{"sub":"123"}',
          secret: "do-not-share",
          algorithm: "HS512",
          expiration: "300",
        },
        sensitiveInputs,
      ),
    ).toEqual({
      payload: '{"sub":"123"}',
      algorithm: "HS512",
      expiration: "300",
    });
  });
});

describe("Sanitize Secrets tool URL state", () => {
  const sensitiveInputs = new Set(["text"]);

  it("does not hydrate sanitizer input from a query string", () => {
    expect(
      inputsFromSearchParams(
        new URLSearchParams("text=synthetic-secret&apiKeys=false&auth=true"),
        sensitiveInputs,
      ),
    ).toEqual({ apiKeys: false, auth: true });
  });

  it("excludes sanitizer input while retaining category selections", () => {
    expect(
      shareableToolInputs(
        { text: "synthetic-secret", apiKeys: false, auth: true },
        sensitiveInputs,
      ),
    ).toEqual({ apiKeys: "false", auth: "true" });
  });
});
