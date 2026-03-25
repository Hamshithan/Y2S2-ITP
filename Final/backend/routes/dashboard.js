import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Total vehicles
    const [vehiclesResult] = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    const totalVehicles = vehiclesResult[0].count;

    // Active drivers
    const [driversResult] = await pool.query("SELECT COUNT(*) as count FROM drivers WHERE status = 'Active'");
    const activeDrivers = driversResult[0].count;

    // Parcels in transit
    const [transitResult] = await pool.query("SELECT COUNT(*) as count FROM parcels WHERE status = 'In Transit'");
    const parcelsInTransit = transitResult[0].count;

    // Completed deliveries (Delivered)
    const [completedResult] = await pool.query("SELECT COUNT(*) as count FROM parcels WHERE status = 'Delivered'");
    const completedDeliveries = completedResult[0].count;

    res.json({
      totalVehicles,
      activeDrivers,
      parcelsInTransit,
      completedDeliveries
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent deliveries
router.get('/recent-deliveries', async (req, res) => {
  try {
    const [deliveries] = await pool.query(`
      SELECT 
        p.tracking_id as id,
        p.status,
        p.destination as location,
        p.updated_at as time,
        d.name as driver_name
      FROM parcels p
      LEFT JOIN drivers d ON p.driver_id = d.id
      ORDER BY p.updated_at DESC
      LIMIT 10
    `);

    // Format time as relative
    const formattedDeliveries = deliveries.map(delivery => ({
      ...delivery,
      time: formatRelativeTime(delivery.time)
    }));

    res.json(formattedDeliveries);
  } catch (error) {
    console.error('Error fetching recent deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch recent deliveries' });
  }
});

// Get fleet status
router.get('/fleet-status', async (req, res) => {
  try {
    const [fleet] = await pool.query(`
      SELECT 
        v.vehicle_number as vehicle,
        d.name as driver,
        v.status,
        CASE 
          WHEN v.status = 'Active' THEN FLOOR(50 + RAND() * 50)
          ELSE 0
        END as progress
      FROM vehicles v
      LEFT JOIN drivers d ON v.id = d.id
      WHERE v.status IN ('Active', 'Maintenance')
      LIMIT 10
    `);

    res.json(fleet);
  } catch (error) {
    console.error('Error fetching fleet status:', error);
    res.status(500).json({ error: 'Failed to fetch fleet status' });
  }
});

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default router;
