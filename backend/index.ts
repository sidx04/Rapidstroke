import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.ts';
import { startBackgroundTasks } from './services/backgroundTasks.ts';

// Import routes
import authRoutes from './routes/auth.ts';
import patientRoutes from './routes/patients.ts';
import alertRoutes from './routes/alerts.ts';
import notificationRoutes from './routes/notifications.ts';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: '*', // In production, specify allowed origins
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RapidStroke API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 RapidStroke API Server running on all interfaces:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 For Expo: http://10.50.133.1:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://10.50.133.1:${PORT}/api/auth`);
  console.log(`👥 Patient endpoints: http://10.50.133.1:${PORT}/api/patients`);

  // Start background notification tasks
  startBackgroundTasks();
});