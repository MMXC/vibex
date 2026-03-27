import { Hono } from 'hono';
import { CloudflareEnv } from '../../../lib/env';
const minimal_ = new Hono<{ Bindings: CloudflareEnv }>();

minimal_.get('/', async (c) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: ping\ndata: hello\n\n'));
      setTimeout(() => {
        controller.enqueue(encoder.encode('event: done\ndata: world\n\n'));
        controller.close();
      }, 500);
    }
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
});

export default minimal_;
