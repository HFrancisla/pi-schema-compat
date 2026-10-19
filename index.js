import { normalizeRequestPayload } from './schema.js';

/**
 * Pi >= 1.2.0 exposes before_provider_request AFTER OpenAI tool conversion
 * and BEFORE the HTTP request. No tool re-registration or global patching.
 */
export default function schemaCompat(pi) {
  const stats = { requests: 0, patchedRequests: 0, tools: 0, schemaObjects: 0 };

  pi.on('before_provider_request', (event) => {
    const result = normalizeRequestPayload(event.payload);
    stats.requests++;
    if (result.added === 0) return undefined;
    stats.patchedRequests++;
    stats.tools += result.toolsChanged;
    stats.schemaObjects += result.added;
    return result.value;
  });

  pi.registerCommand('schema-compat', {
    description: 'Show OpenAI tool-schema compatibility normalization statistics',
    handler(_args, ctx) {
      const message = `Schema compat: ${stats.patchedRequests}/${stats.requests} requests patched; ${stats.tools} tools, ${stats.schemaObjects} object schemas normalized.`;
      if (ctx.hasUI) ctx.ui.notify(message, 'info');
      else console.error(message);
    },
  });
}
