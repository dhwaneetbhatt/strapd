import { useEffect, useRef } from "react";
import { appConfig } from "../config";

/**
 * Hook to auto-process inputs with debouncing
 * Use this for tools that need instant feedback as user types
 */
export const useAutoProcess = (
  processInputs: () => void,
  inputs: Record<string, unknown>,
  delay = appConfig.tools.debounceDelay,
) => {
  const debounceTimerRef = useRef<number>();

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if there's any meaningful input
    const hasInput =
      Object.keys(inputs).length > 0 &&
      Object.values(inputs).some((value) => {
        if (typeof value === "string") return value.trim();
        if (typeof value === "number") return !Number.isNaN(value);
        return value !== null && value !== undefined;
      });

    if (!hasInput) {
      return;
    }

    // Debounce the auto-processing
    debounceTimerRef.current = setTimeout(() => {
      processInputs();
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputs, processInputs, delay]);
};

/**
 * Hook to process when specific values change
 * Use this for tools that should only regenerate on meaningful changes
 */
export const useProcessOnChange = (
  processInputs: () => void,
  watchedValues: unknown[],
  options?: {
    skipInitial?: boolean;
  },
) => {
  const isInitialMount = useRef(true);
  const lastValuesRef = useRef<unknown[]>(watchedValues);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We're intentionally managing value comparison with refs
  useEffect(() => {
    // Skip on initial mount if requested
    if (options?.skipInitial && isInitialMount.current) {
      isInitialMount.current = false;
      lastValuesRef.current = watchedValues;
      return;
    }

    // Check if any watched value actually changed
    const hasChanged = watchedValues.some(
      (value, index) => value !== lastValuesRef.current[index],
    );

    if (hasChanged) {
      lastValuesRef.current = watchedValues;
      processInputs();
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [...watchedValues, processInputs, options?.skipInitial]);
};
