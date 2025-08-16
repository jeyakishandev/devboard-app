import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/database";
import { syncModels } from "./models";

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  await connectDB();
  await syncModels(); // dev only (migrations en prod)
  app.listen(PORT, () => console.log(`[devboard] backend http://localhost:${PORT}`));
}

bootstrap();

