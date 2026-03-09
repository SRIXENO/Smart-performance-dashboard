require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { createApp } = require('./app');

const app = createApp();
const PORT = process.env.PORT || 5000;
let serverInstance = null;

const shutdown = async (signal) => {
  try {
    console.log(`[shutdown] Received ${signal}. Closing server...`);
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.connection.close(false);
    console.log('[shutdown] Clean shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('[shutdown] Failed:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  const dbConnected = await connectDB();

  serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database status on startup: ${dbConnected ? 'connected' : 'not connected'}`);
  });

  return serverInstance;
};

if (require.main === module) {
  startServer();

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
  });
}

module.exports = {
  app,
  createApp,
  startServer,
};
