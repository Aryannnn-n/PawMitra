import express from 'express';
import AdminRouter from './routes/admin.routes.js';
import AdoptionRouter from './routes/adoption.routes.js';
import AuthRouter from './routes/auth.routes.js';
import ChatRouter from './routes/chat.routes.js';
import PetRouter from './routes/pet.routes.js';
import UserRouter from './routes/user.routes.js';

const app = express();

app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({ msg: '🐾 PawMitra backend is running!' });
});

// Routes
app.use('/api/auth', AuthRouter);
app.use('/api/users', UserRouter);
app.use('/api/admin', AdminRouter);
app.use('/api/pets', PetRouter);
app.use('/api/adoptions', AdoptionRouter);
app.use('/api/chat', ChatRouter);

export { app };
