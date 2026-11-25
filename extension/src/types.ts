export interface Finding {
  kind: string;
  count: number;
}

export interface ScanResponse {
  ok: boolean;
  clean: boolean;
  findings: Finding[];
  scrubbedText: string;
  error?: string;
}

export interface ScanRequest {
  type: "SCAN_TEXT";
  text: string;
}

export type WarningAction = "scrubbed" | "raw" | "cancel";
