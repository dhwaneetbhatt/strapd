import {
  PIPE_COLLECTION_SCHEMA_VERSION,
  PIPE_DOCUMENT_SCHEMA_VERSION,
  PIPE_TOOL_CONTRACT_VERSION,
  type Pipe,
  type PipeCollection,
  type PipeDocument,
} from "../types";

export const VALID_PIPE_ID = "11111111-1111-4111-8111-111111111111";
export const FIRST_STEP_ID = "22222222-2222-4222-8222-222222222222";
export const SECOND_STEP_ID = "33333333-3333-4333-8333-333333333333";

export const validPipeFixture = (): Pipe => ({
  id: VALID_PIPE_ID,
  name: "Encode and reverse",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  steps: [
    {
      id: FIRST_STEP_ID,
      toolId: "encoding-base64",
      toolVersion: PIPE_TOOL_CONTRACT_VERSION,
      config: { mode: "encode" },
    },
    {
      id: SECOND_STEP_ID,
      toolId: "string-reverse",
      toolVersion: PIPE_TOOL_CONTRACT_VERSION,
      config: {},
    },
  ],
});

export const validSourcePipeFixture = (): Pipe => ({
  ...validPipeFixture(),
  name: "Generate and encode",
  steps: [
    {
      id: FIRST_STEP_ID,
      toolId: "identifier-uuid-generator",
      toolVersion: PIPE_TOOL_CONTRACT_VERSION,
      config: { version: "v4", count: 1 },
    },
    {
      id: SECOND_STEP_ID,
      toolId: "encoding-base64",
      toolVersion: PIPE_TOOL_CONTRACT_VERSION,
      config: { mode: "encode" },
    },
  ],
});

export const validDocumentFixture = (): PipeDocument => ({
  schemaVersion: PIPE_DOCUMENT_SCHEMA_VERSION,
  pipe: validPipeFixture(),
});

export const validCollectionFixture = (): PipeCollection => ({
  schemaVersion: PIPE_COLLECTION_SCHEMA_VERSION,
  pipes: [validPipeFixture()],
});
