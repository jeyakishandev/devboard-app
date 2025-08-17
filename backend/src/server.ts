import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import { registerSockets } from './socket/index';
import { sequelize } from './models';
import { ensureDatabaseExists } from './config/ensureDb';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET","POST"] } });
  app.set("io", io);
  registerSockets(io);

  await sequelize.authenticate();

const mode = (process.env.DB_SYNC || 'safe').toLowerCase(); // safe | alter | force
if (mode === 'force') {
  console.log('[db] sync force (DROP & CREATE)');
  await sequelize.sync({ force: true });
} else if (mode === 'alter') {
  console.log('[db] sync alter');
  await sequelize.sync({ alter: true });
} else {
  console.log('[db] sync safe');
  await sequelize.sync();
}

  console.log("[db] ready");

  httpServer.listen(PORT, () => {
    console.log(`[devboard] backend http://localhost:${PORT}`);
  });
}

start();



