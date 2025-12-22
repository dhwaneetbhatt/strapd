import { wasmWrapper } from "../../wasm";

/**
 * Get current timestamp
 * @param millis Whether to return in milliseconds
 */
export const now = (millis = false) => {
  return wasmWrapper.datetime_now(millis);
};

/**
 * Convert timestamp to human-readable date or ISO string
 * @param timestamp Unix timestamp
 * @param format Output format ('Human' or 'Iso')
 * @param isMillis Whether input is in milliseconds
 */
export const fromTimestamp = (
  timestamp: number,
  format: "Human" | "Iso" = "Human",
  isMillis = false,
) => {
  if (isMillis) {
    return wasmWrapper.datetime_from_timestamp_millis(timestamp, format);
  }
  return wasmWrapper.datetime_from_timestamp(timestamp, format);
};
