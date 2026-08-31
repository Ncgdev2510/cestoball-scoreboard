import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';

function syncPlugin(): Plugin {
  let latestState: unknown = null;
  const clients = new Set<{ write: (data: string) => void; end: () => void }>();

  return {
    name: 'scoreboard-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        // 1. Get Network Info (LAN IP for QR Code)
        if (req.url.startsWith('/api/sync/info') && req.method === 'GET') {
          const interfaces = os.networkInterfaces();
          const ips: string[] = [];

          for (const netList of Object.values(interfaces)) {
            if (!netList) continue;
            for (const net of netList) {
              if (!net.internal && net.family === 'IPv4') {
                ips.push(net.address);
              }
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ips, port: 5173 }));
          return;
        }

        // 2. Server-Sent Events (Real-time stream for remote devices)
        if (req.url.startsWith('/api/sync/events') && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          if (latestState) {
            res.write(`event: state\ndata: ${JSON.stringify(latestState)}\n\n`);
          }

          const client = {
            write: (data: string) => res.write(data),
            end: () => res.end(),
          };
          clients.add(client);

          const interval = setInterval(() => {
            res.write(': keepalive\n\n');
          }, 15000);

          req.on('close', () => {
            clearInterval(interval);
            clients.delete(client);
          });
          return;
        }

        // 3. Update Match State from any client
        if (req.url.startsWith('/api/sync/state') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              if (body) {
                latestState = JSON.parse(body);
                const sseMsg = `event: state\ndata: ${body}\n\n`;
                for (const client of clients) {
                  client.write(sseMsg);
                }
              }
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        // 4. Get Current State
        if (req.url.startsWith('/api/sync/state') && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify(latestState ?? null));
          return;
        }

        // 5. Emit Board Event (triple, timeout, alarm)
        if (req.url.startsWith('/api/sync/event') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              if (body) {
                const sseMsg = `event: board-event\ndata: ${body}\n\n`;
                for (const client of clients) {
                  client.write(sseMsg);
                }
              }
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid Event' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), syncPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
