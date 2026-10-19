// One Vercel function: GET is the health check, POST runs PAL and Wren in parallel.
// The server is stateless; the client's Director decides everything except wording.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { SYSTEM, stateText } from './_prompts.js';

const Out = z.object({
  say: z.string().describe('the chat line'),
  ooc: z.boolean().describe('true only to step outside the story'),
});

const Line = z.object({ who: z.enum(['player', 'pal', 'wren']), text: z.string().max(400) });
const TurnRequest = z.object({
  beat: z.enum(['a1', 'a2']),
  msg: z.string().min(1).max(280),
  name: z.string().regex(/^[\p{L}\p{N} _'.-]{1,16}$/u),
  clock: z.string().regex(/^[23]:\d\d:\d\d$/),
  clues: z.object({ who: z.boolean(), liar: z.boolean(), where: z.boolean() }),
  wantGhost: z.boolean(),
  history: z.array(Line).max(14),
});

const live = () => process.env.LLM_ENABLED !== 'false' && !!process.env.ANTHROPIC_API_KEY;
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

let client;
const getClient = () => (client ??= new Anthropic({ maxRetries: 0, timeout: 8000 }));

// Server-side refusal fallbacks for Opus and Sonnet; dropped for a model if it rejects them.
const fallbacksOff = new Set();

const MODEL = {
  pal: () => process.env.MODEL_PAL || 'claude-sonnet-5-5',
  wren: () => process.env.MODEL_WREN || 'claude-opus-5-5', // Mon Oct 19 benchmark pick
};

function thinkingFor(model) {
  if (model.includes('haiku')) return { thinking: { type: 'disabled' } };
  if (model.includes('sonnet')) return { thinking: { type: 'between_tools' } };
  return {}; // Opus: can't be disabled; low effort keeps it short
}

async function ask(agent, req) {
  const model = MODEL[agent]();
  const params = {
    model,
    max_tokens: 2048,
    ...thinkingFor(model),
    system: [{ type: 'text', text: SYSTEM[agent], cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: stateText(req, agent) }],
    output_config: { effort: 'low', format: zodOutputFormat(Out) },
  };
  const useFallbacks = !model.includes('haiku') && !fallbacksOff.has(model);
  let msg;
  try {
    msg = useFallbacks
      ? await getClient().beta.messages.parse({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : await getClient().messages.parse(params);
  } catch (e) {
    if (useFallbacks && e?.status === 400) {
      fallbacksOff.add(model);
      msg = await getClient().messages.parse(params);
    } else throw e;
  }
  const usage = { in: msg.usage?.input_tokens, out: msg.usage?.output_tokens, cache_read: msg.usage?.cache_read_input_tokens ?? 0, model: msg.model };
  if (msg.stop_reason === 'refusal') return { refused: true, usage };
  if (msg.stop_reason !== 'end_turn' || !msg.parsed_output) return { usage };
  return { out: msg.parsed_output, usage };
}

export async function GET() {
  return json({ live: live() });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || new URL(origin).host !== host) return json({ error: 'origin' }, 403);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 8000) return json({ error: 'too large' }, 413);

  let body;
  try {
    body = TurnRequest.parse(JSON.parse(raw));
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  if (!live()) return json({ error: 'offline' }, 503);

  const t0 = Date.now();
  const [pal, wren] = await Promise.allSettled([ask('pal', body), body.wantGhost ? ask('wren', body) : Promise.resolve(null)]);
  const pick = (r) => (r.status === 'fulfilled' ? r.value : { error: String(r.reason?.status || r.reason?.name || 'error') });
  const p = pick(pal), w = pick(wren);
  console.log(JSON.stringify({ ms: Date.now() - t0, pal: p?.usage, wren: w?.usage, perr: p?.error, werr: w?.error }));
  return json({
    pal: p?.out ?? null,
    wren: w?.out ?? null,
    refused: !!p?.refused,
    ms: Date.now() - t0,
    usage: { pal: p?.usage ?? null, wren: w?.usage ?? null },
  });
}
