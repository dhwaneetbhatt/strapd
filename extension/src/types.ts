export type PasteMode = "ask" | "auto" | "paused";
export type ActivePasteMode = Exclude<PasteMode, "paused">;

export interface DetectorSettings {
  apiKey: boolean;
  jwt: boolean;
  email: boolean;
  ip: boolean;
}

export interface ExtensionSettings {
  mode: PasteMode;
  pauseUntil: number | null;
  detectors: DetectorSettings;
  customSites: string[];
}

export interface Finding {
  kind: string;
  count: number;
}

export interface DiffSegment {
  start: number;
  end: number;
  raw: string;
  tag: string;
}

export interface ScanResponse {
  ok: boolean;
  clean: boolean;
  findings: Finding[];
  scrubbedText: string;
  elapsedMs: number;
  error?: string;
}

export interface ScanRequest {
  type: "SCAN_TEXT";
  text: string;
  detectors: DetectorSettings;
}

export interface RecordRedactionMessage {
  type: "RECORD_REDACTION";
  count: number;
}

export interface ResumePausedMessage {
  type: "RESUME_PAUSED";
}

export type WorkerMessage =
  | ScanRequest
  | RecordRedactionMessage
  | ResumePausedMessage;

export type WarningAction = "scrubbed" | "raw" | "cancel";

export interface WarningSelection {
  action: WarningAction;
  alwaysAuto: boolean;
}
