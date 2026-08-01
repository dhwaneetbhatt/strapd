import type {
  PipeConfigConstraint,
  PipeConfigValidation,
  PipeJsonObject,
  PipeToolContract,
  PipeToolInput,
  ToolOption,
} from "../../types";
import { PIPE_TOOL_CONTRACT_VERSION } from "./types";
import { isJsonValue } from "./utils";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export const validateToolConfig = (
  options: ToolOption[],
  config: unknown,
  constraints: PipeConfigConstraint[] = [],
): PipeConfigValidation => {
  if (!isPlainObject(config) || !isJsonValue(config)) {
    return {
      valid: false,
      issues: [{ message: "Configuration must be a JSON-safe object" }],
    };
  }

  const issues: { field?: string; message: string }[] = [];
  const optionById = new Map(options.map((option) => [option.id, option]));

  for (const key of Object.keys(config)) {
    if (!optionById.has(key)) {
      issues.push({
        field: key,
        message: `Unknown configuration field: ${key}`,
      });
    }
  }

  for (const option of options) {
    const value = config[option.id];
    if (value === undefined) {
      issues.push({
        field: option.id,
        message: `${option.name} is required`,
      });
      continue;
    }

    if (option.type === "boolean" && typeof value !== "boolean") {
      issues.push({
        field: option.id,
        message: `${option.name} must be true or false`,
      });
    }

    if (option.type === "string" && typeof value !== "string") {
      issues.push({ field: option.id, message: `${option.name} must be text` });
    }

    if (option.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        issues.push({
          field: option.id,
          message: `${option.name} must be a number`,
        });
      } else {
        if (option.min !== undefined && value < option.min) {
          issues.push({
            field: option.id,
            message: `${option.name} must be at least ${option.min}`,
          });
        }
        if (option.max !== undefined && value > option.max) {
          issues.push({
            field: option.id,
            message: `${option.name} must be at most ${option.max}`,
          });
        }
        for (const validation of option.validations ?? []) {
          if (validation.rule !== "integer") continue;
          const isValid = validation.safe
            ? Number.isSafeInteger(value)
            : Number.isInteger(value);
          if (!isValid) {
            issues.push({
              field: option.id,
              message:
                validation.message ?? `${option.name} must be a whole number`,
            });
          }
        }
      }
    }

    if (option.type === "string" && typeof value === "string") {
      for (const validation of option.validations ?? []) {
        if (validation.rule !== "stringLength") continue;
        const length = [...value].length;
        if (
          (validation.min !== undefined && length < validation.min) ||
          (validation.max !== undefined && length > validation.max)
        ) {
          const expected =
            validation.min === validation.max
              ? `exactly ${validation.min}`
              : validation.min !== undefined && validation.max !== undefined
                ? `between ${validation.min} and ${validation.max}`
                : validation.min !== undefined
                  ? `at least ${validation.min}`
                  : `at most ${validation.max}`;
          issues.push({
            field: option.id,
            message:
              validation.message ??
              `${option.name} must contain ${expected} character${validation.min === 1 && validation.max === 1 ? "" : "s"}`,
          });
        }
      }
    }

    if (
      option.type === "select" &&
      (typeof value !== "string" || !option.options?.includes(value))
    ) {
      issues.push({
        field: option.id,
        message: `${option.name} must be one of its declared options`,
      });
    }
  }

  if (issues.length === 0) {
    const isTruthy = (value: unknown) =>
      typeof value === "string" ? value.length > 0 : Boolean(value);

    for (const constraint of constraints) {
      if (constraint.rule === "numberOrder") {
        const lower = config[constraint.lower] as number;
        const upper = config[constraint.upper] as number;
        if (lower > upper) {
          issues.push({
            field: constraint.field ?? constraint.upper,
            message:
              constraint.message ??
              `${constraint.upper} must be greater than or equal to ${constraint.lower}`,
          });
        }
      }

      if (constraint.rule === "sameOptionGroup") {
        const values = constraint.fields.map((field) => config[field]);
        const sharesGroup = constraint.groups.some((group) =>
          values.every(
            (value) => typeof value === "string" && group.includes(value),
          ),
        );
        if (!sharesGroup) {
          issues.push({
            field:
              constraint.field ??
              constraint.fields[constraint.fields.length - 1],
            message:
              constraint.message ??
              `${constraint.fields.join(" and ")} must use compatible options`,
          });
        }
      }

      if (constraint.rule === "minimumTruthy") {
        const truthyCount = constraint.fields.filter((field) =>
          isTruthy(config[field]),
        ).length;
        if (truthyCount < constraint.minimum) {
          issues.push({
            field: constraint.field,
            message:
              constraint.message ??
              `Select at least ${constraint.minimum} of the declared options`,
          });
        }
      }

      if (constraint.rule === "numberAtLeastTruthyCount") {
        const minimum = constraint.fields.filter((field) =>
          isTruthy(config[field]),
        ).length;
        if ((config[constraint.numberField] as number) < minimum) {
          issues.push({
            field: constraint.field ?? constraint.numberField,
            message:
              constraint.message ??
              `${constraint.numberField} must be at least ${minimum} for the selected options`,
          });
        }
      }
    }
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true };
};

export const createToolConfigValidator = (
  options: ToolOption[],
  constraints: PipeConfigConstraint[] = [],
) => {
  return (config: unknown): PipeConfigValidation =>
    validateToolConfig(options, config, constraints);
};

export const pipeDefaults = (options: ToolOption[]): PipeJsonObject =>
  Object.fromEntries(
    options.map((option) => [option.id, option.defaultValue]),
  ) as PipeJsonObject;

export const createPipeToolContract = ({
  input,
  config = [],
  constraints = [],
  outputKey = "result",
}: {
  input: PipeToolInput;
  config?: ToolOption[];
  constraints?: PipeConfigConstraint[];
  outputKey?: string;
}): PipeToolContract => ({
  version: PIPE_TOOL_CONTRACT_VERSION,
  input,
  output: { key: outputKey },
  config,
  constraints,
  defaults: pipeDefaults(config),
  validateConfig: createToolConfigValidator(config, constraints),
});
