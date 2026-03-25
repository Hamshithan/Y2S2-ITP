import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboard.js';
import driverRoutes from './routes/drivers.js';
import vehicleRoutes from './routes/vehicles.js';
import parcelRoutes from './routes/parcels.js';
import tripRoutes from './routes/trips.js';
import routeRoutes from './routes/routes.js';
import reviewRoutes from './routes/reviews.js';
import customerRoutes from './routes/customers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/customers', customerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
