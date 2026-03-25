import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all trips with vehicle and driver info
router.get('/', async (req, res) => {
  try {
    const [trips] = await pool.query(`
      SELECT 
        t.*,
        v.vehicle_number,
        v.capacity as vehicle_capacity,
        d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `);
    
    // Get parcels for each trip
    for (let trip of trips) {
      const [parcels] = await pool.query(`
        SELECT p.tracking_id
        FROM trip_parcels tp
        JOIN parcels p ON tp.parcel_id = p.id
        WHERE tp.trip_id = ?
      `, [trip.id]);
      trip.parcels = parcels.map(p => p.tracking_id);
    }
    
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get single trip by ID
router.get('/:id', async (req, res) => {
  try {
    const [trips] = await pool.query(`
      SELECT 
        t.*,
        v.vehicle_number,
        v.capacity as vehicle_capacity,
        d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const trip = trips[0];
    
    // Get parcels for this trip
    const [parcels] = await pool.query(`
      SELECT p.id, p.tracking_id
      FROM trip_parcels tp
      JOIN parcels p ON tp.parcel_id = p.id
      WHERE tp.trip_id = ?
    `, [trip.id]);
    trip.parcels = parcels;
    
    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create new trip
router.post('/', async (req, res) => {
  try {
    const { trip_number, vehicle_id, driver_id, route_description, total_weight, capacity_used, status, parcel_ids } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO trips (trip_number, vehicle_id, driver_id, route_description, total_weight, capacity_used, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trip_number || `TRIP-${Date.now()}`, vehicle_id, driver_id, route_description, total_weight, capacity_used, status || 'Active']
    );
    
    const tripId = result.insertId;
    
    // Add parcel associations if provided
    if (parcel_ids && parcel_ids.length > 0) {
      for (const parcelId of parcel_ids) {
        await pool.query('INSERT INTO trip_parcels (trip_id, parcel_id) VALUES (?, ?)', [tripId, parcelId]);
      }
    }
    
    const [newTrip] = await pool.query(`
      SELECT 
        t.*,
        v.vehicle_number,
        d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `, [tripId]);
    
    res.status(201).json(newTrip[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip', details: error.message });
  }
});

// Update trip
router.put('/:id', async (req, res) => {
  try {
    const { trip_number, vehicle_id, driver_id, route_description, total_weight, capacity_used, status, parcel_ids } = req.body;
    const tripId = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE trips SET trip_number = ?, vehicle_id = ?, driver_id = ?, route_description = ?, total_weight = ?, capacity_used = ?, status = ? WHERE id = ?',
      [trip_number, vehicle_id, driver_id, route_description, total_weight, capacity_used, status, tripId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Update parcel associations if provided
    if (parcel_ids) {
      await pool.query('DELETE FROM trip_parcels WHERE trip_id = ?', [tripId]);
      for (const parcelId of parcel_ids) {
        await pool.query('INSERT INTO trip_parcels (trip_id, parcel_id) VALUES (?, ?)', [tripId, parcelId]);
      }
    }
    
    const [updatedTrip] = await pool.query(`
      SELECT 
        t.*,
        v.vehicle_number,
        d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `, [tripId]);
    
    res.json(updatedTrip[0]);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete trip
router.delete('/:id', async (req, res) => {
  try {
    // Trip parcels will be deleted automatically due to ON DELETE CASCADE
    const [result] = await pool.query('DELETE FROM trips WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;
