import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const server = createApp().listen(port);

server.on('error', (error: NodeJS.ErrnoException) => {
  // exit non-zero rather than only logging. a process that failed to bind is no use
  // alive, and a supervisor can only react to what it can observe.
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  }
  if (error.code === 'EACCES') {
    console.error(`Port ${port} requires elevated privileges`);
    process.exit(1);
  }
  throw error;
});
