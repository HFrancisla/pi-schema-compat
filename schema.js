/**
 * JSON Schema compatibility normalization for OpenAI Chat Completions tools.
 *
 * JSON Schema permits omitting `required`. Some OpenAI-compatible gateways
 * incorrectly validate its absence as null. This makes every object schema
 * explicit about optional properties without making any property required.
 *
 * Traverse JSON Schema positions ONLY. Never modify examples, defaults,
 * descriptions, function arguments or unrelated provider request fields.
 */

const SINGLE_SCHEMA_KEYS = [
  'items', 'additionalItems', 'additionalProperties', 'unevaluatedProperties',
  'unevaluatedItems', 'propertyNames', 'contains', 'not', 'if', 'then', 'else',
  'contentSchema',
];
const SCHEMA_MAP_KEYS = [
  'properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas',
];
const SCHEMA_ARRAY_KEYS = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Return { value, added }. All changes are immutable and idempotent. */
export function normalizeSchema(schema, ancestors = new WeakSet()) {
  if (!isRecord(schema) || ancestors.has(schema)) return { value: schema, added: 0 };
  ancestors.add(schema);
  let result = schema;
  let added = 0;
  const setIfChanged = (key, next) => {
    if (next === schema[key]) return;
    if (result === schema) result = { ...schema };
    result[key] = next;
  };

  try {
    for (const key of SINGLE_SCHEMA_KEYS) {
      const current = schema[key];
      if (!isRecord(current)) continue;
      const nested = normalizeSchema(current, ancestors);
      setIfChanged(key, nested.value);
      added += nested.added;
    }
    for (const key of SCHEMA_ARRAY_KEYS) {
      const current = schema[key];
      if (!Array.isArray(current)) continue;
      let updated;
      for (let i = 0; i < current.length; i++) {
        const nested = normalizeSchema(current[i], ancestors);
        if (nested.value !== current[i]) {
          if (!updated) updated = current.slice();
          updated[i] = nested.value;
        }
        added += nested.added;
      }
      if (updated) setIfChanged(key, updated);
    }
    for (const key of SCHEMA_MAP_KEYS) {
      const current = schema[key];
      if (!isRecord(current)) continue;
      let updated;
      for (const [name, child] of Object.entries(current)) {
        const nested = normalizeSchema(child, ancestors);
        if (nested.value !== child) {
          if (!updated) updated = { ...current };
          updated[name] = nested.value;
        }
        added += nested.added;
      }
      if (updated) setIfChanged(key, updated);
    }
    if (schema.type === 'object' && !Array.isArray(schema.required)) {
      if (result === schema) result = { ...schema };
      result.required = [];
      added++;
    }
    return { value: result, added };
  } finally {
    ancestors.delete(schema);
  }
}

/**
 * Only touch OpenAI Chat Completions-shaped tools[].function.parameters.
 * Return the original payload reference when there is nothing to change.
 */
export function normalizeRequestPayload(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.tools)) {
    return { value: payload, added: 0, toolsChanged: 0 };
  }
  let updatedTools;
  let added = 0;
  let toolsChanged = 0;
  for (let i = 0; i < payload.tools.length; i++) {
    const tool = payload.tools[i];
    if (!isRecord(tool) || tool.type !== 'function' || !isRecord(tool.function)) continue;
    if (!isRecord(tool.function.parameters)) continue;
    const nested = normalizeSchema(tool.function.parameters);
    if (nested.value === tool.function.parameters) continue;
    if (!updatedTools) updatedTools = payload.tools.slice();
    updatedTools[i] = {
      ...tool,
      function: { ...tool.function, parameters: nested.value },
    };
    added += nested.added;
    toolsChanged++;
  }
  return updatedTools
    ? { value: { ...payload, tools: updatedTools }, added, toolsChanged }
    : { value: payload, added: 0, toolsChanged: 0 };
}
