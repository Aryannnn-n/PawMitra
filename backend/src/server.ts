import dotenv from 'dotenv';
import http from 'http';
import { app } from './app.js';
import { initWebSocket } from './websocket.js';
dotenv.config();

const PORT = process.env.PORT ?? 3000;

// ── Create HTTP server from Express app ──────────────────────────────────────
// WebSocket requires a raw HTTP server — can't attach to Express directly
const server = http.createServer(app);

// ── Attach WebSocket server ───────────────────────────────────────────────────
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 HTTP  server running on port ${PORT}`);
  console.log(`🔌 WS    server running on ws://localhost:${PORT}`);
});
