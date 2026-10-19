import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRequestPayload, normalizeSchema } from '../schema.js';

test('ls: add required [] without mutating original', () => {
  const ls = { type: 'object', properties: { path: { type: 'string' }, limit: { type: 'number' } } };
  const p = { model: 'x', stream: true, tools: [{ type: 'function', function: { name: 'ls', parameters: ls } }] };
  const result = normalizeRequestPayload(p);
  assert.equal(result.added, 1);
  assert.equal(result.toolsChanged, 1);
  assert.deepEqual(result.value.tools[0].function.parameters.required, []);
  assert.equal(ls.required, undefined);
  assert.equal(result.value.stream, true);
  assert.strictEqual(normalizeRequestPayload(result.value).value, result.value);
});

test('read: existing required is preserved and no copy made', () => {
  const p = { tools: [{ type: 'function', function: { name: 'read', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } }] };
  assert.strictEqual(normalizeRequestPayload(p).value, p);
  assert.deepEqual(p.tools[0].function.parameters.required, ['path']);
});

test('deep subagent properties / variants / definitions normalized', () => {
  const a = { type: 'object', properties: { args: { type: 'object', additionalProperties: { type: 'object' } }, options: { anyOf: [{ type: 'object' }, { type: 'null' }] } }, $defs: { task: { type: 'object' } } };
  const res = normalizeSchema(a);
  assert.equal(res.added, 5);
  assert.deepEqual(res.value.required, []);
  assert.deepEqual(res.value.properties.args.required, []);
  assert.deepEqual(res.value.properties.args.additionalProperties.required, []);
  assert.deepEqual(res.value.properties.options.anyOf[0].required, []);
  assert.deepEqual(res.value.$defs.task.required, []);
  assert.equal(a.required, undefined);
});

test('do not touch non Chat Completions tools nor body data', () => {
  const input = { tools: [{ type: 'custom', custom: { format: { type: 'object' } } }], response_format: { type: 'object' }, messages: [{ content: { type: 'object' } }] };
  assert.strictEqual(normalizeRequestPayload(input).value, input);
});

test('non-object schemas, schema examples, defaults are not changed', () => {
  const s = { type: 'object', required: ['x'], properties: { x: { type: 'string', default: { type: 'object' }, examples: [{ type: 'object' }] } } };
  assert.strictEqual(normalizeSchema(s).value, s);
});

test('boolean schemas, null required, and variants are supported', () => {
  const schema = { type: 'object', required: null, properties: { ok: true, no: false, nested: { allOf: [{ type: 'object' }] } } };
  const x = normalizeSchema(schema);
  assert.deepEqual(x.value.required, []);
  assert.deepEqual(x.value.properties.nested.allOf[0].required, []);
  assert.equal(x.added, 2);
});
