import express from 'express';
import AdminRouter from './routes/admin.routes.js';
import AuthRouter from './routes/auth.routes.js';
import UserRouter from './routes/user.routes.js';

// Test Prisma Client

const app = express();
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Hello , the backend is working !');
});

// Routes middleware
app.use('/v1/user', UserRouter);
app.use('/v1/admin', AdminRouter);
app.use('/api/auth', AuthRouter);

export { app };
