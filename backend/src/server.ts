import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import { registerSockets } from './socket/index';
import { sequelize } from './models';
import { ensureDatabaseExists } from './config/ensureDb';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET','POST'] } });
  app.set('io', io);
  registerSockets(io);

  // DB up + tables
  await ensureDatabaseExists();
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
 // ou { alter: true } si tu préfères
  console.log('[db] ready');

  httpServer.listen(PORT, () => {
    console.log(`[devboard] backend http://localhost:${PORT}`);
  });
}

start();



