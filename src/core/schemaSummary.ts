import { z } from "zod";

export type InputSchemaSummary =
  | {
      type: "object";
      properties: Record<
        string,
        {
          type: string;
          optional: boolean;
          description?: string;
          enum?: string[];
          default?: unknown;
          pattern?: string;
        }
      >;
    }
  | { type: "unknown" };

function unwrap(schema: z.ZodTypeAny): {
  schema: z.ZodTypeAny;
  optional: boolean;
  defaultValue: unknown | undefined;
} {
  let current: z.ZodTypeAny = schema;
  let optional = false;
  let defaultValue: unknown | undefined = undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (current instanceof z.ZodOptional) {
      optional = true;
      current = current.unwrap();
      continue;
    }
    if (current instanceof z.ZodDefault) {
      defaultValue = current._def.defaultValue();
      current = current._def.innerType;
      continue;
    }
    break;
  }

  return { schema: current, optional, defaultValue };
}

function describe(schema: z.ZodTypeAny): string | undefined {
  const desc = (schema as any)?._def?.description;
  return typeof desc === "string" && desc.length > 0 ? desc : undefined;
}

function summarizeScalar(schema: z.ZodTypeAny): {
  type: string;
  enum?: string[];
  pattern?: string;
} {
  if (schema instanceof z.ZodString) {
    const pattern =
      (schema._def.checks?.find((c: any) => c.kind === "regex") as any)?.regex
        ?.source ?? undefined;
    return { type: "string", pattern };
  }
  if (schema instanceof z.ZodNumber) return { type: "number" };
  if (schema instanceof z.ZodBoolean) return { type: "boolean" };
  if (schema instanceof z.ZodNativeEnum) {
    const values = Object.values(schema._def.values).filter(
      (v) => typeof v === "string"
    ) as string[];
    return { type: "string", enum: values };
  }
  if (schema instanceof z.ZodEnum) return { type: "string", enum: schema._def.values };
  return { type: "unknown" };
}

export function zodToInputSchemaSummary(schema: z.ZodTypeAny): InputSchemaSummary {
  const unwrapped = unwrap(schema).schema;
  if (!(unwrapped instanceof z.ZodObject)) return { type: "unknown" };

  const shape = unwrapped.shape as Record<string, z.ZodTypeAny>;
  const properties: Record<
    string,
    {
      type: string;
      optional: boolean;
      description?: string;
      enum?: string[];
      default?: unknown;
      pattern?: string;
    }
  > = {};

  for (const [key, value] of Object.entries(shape)) {
    const { schema: inner, optional, defaultValue } = unwrap(value);
    const scalar = summarizeScalar(inner);
    properties[key] = {
      type: scalar.type,
      optional,
      description: describe(inner) ?? describe(value),
      enum: scalar.enum,
      pattern: scalar.pattern,
      default: defaultValue,
    };
  }

  return { type: "object", properties };
}
