// Requires Node.js 18+ (uses built-in fetch). No npm install needed.
// Usage: ANTHROPIC_API_KEY=sk-ant-... node server.js
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT      = process.env.PORT || 3000;
const API_KEY   = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
    console.error('\n  Error: ANTHROPIC_API_KEY environment variable is not set.\n');
    console.error('  Run with:  ANTHROPIC_API_KEY=sk-ant-... node server.js\n');
    process.exit(1);
}

const server = createServer(async (req, res) => {

    // ── Serve the app ──────────────────────────────────────────────
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        try {
            const html = readFileSync(join(__dirname, 'index.html'));
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (e) {
            res.writeHead(500); res.end('Failed to load index.html');
        }
        return;
    }

    // ── Proxy to Anthropic ─────────────────────────────────────────
    if (req.method === 'POST' && req.url === '/api/research') {
        let body = '';
        for await (const chunk of req) body += chunk;

        try {
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type':    'application/json',
                    'x-api-key':       API_KEY,
                    'anthropic-version': '2023-06-01',
                    'anthropic-beta':  'web-search-2025-03-05',
                },
                body,
            });

            const data = await upstream.json();
            res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: e.message } }));
        }
        return;
    }

    res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`\n  Redgate Pre-Call Discovery → http://localhost:${PORT}\n`);
});
