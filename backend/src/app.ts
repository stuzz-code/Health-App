import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import goalsRoutes from './routes/goals';

import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(
    'mongodb+srv://brycelaw:kezzin11@meancodealong.qngclbo.mongodb.net/my-angular?retryWrites=true&w=majority&appName=MEANcodealong'
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goals', goalsRoutes);

// Health check endpoint
app.get('/api/health-check', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Health API is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Health API server listening on http://localhost:${port}`);
});

export default app;
