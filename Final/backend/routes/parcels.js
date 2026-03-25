import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all parcels with driver and vehicle info
router.get('/', async (req, res) => {
  try {
    const [parcels] = await pool.query(`
      SELECT 
        p.*,
        d.name as driver_name,
        v.vehicle_number
      FROM parcels p
      LEFT JOIN drivers d ON p.driver_id = d.id
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      ORDER BY p.id DESC
    `);
    res.json(parcels);
  } catch (error) {
    console.error('Error fetching parcels:', error);
    res.status(500).json({ error: 'Failed to fetch parcels' });
  }
});

// Get single parcel by ID
router.get('/:id', async (req, res) => {
  try {
    const [parcels] = await pool.query(`
      SELECT 
        p.*,
        d.name as driver_name,
        v.vehicle_number
      FROM parcels p
      LEFT JOIN drivers d ON p.driver_id = d.id
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (parcels.length === 0) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    res.json(parcels[0]);
  } catch (error) {
    console.error('Error fetching parcel:', error);
    res.status(500).json({ error: 'Failed to fetch parcel' });
  }
});

// Create new parcel
router.post('/', async (req, res) => {
  try {
    const { tracking_id, status, origin, destination, driver_id, vehicle_id } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO parcels (tracking_id, status, origin, destination, driver_id, vehicle_id) VALUES (?, ?, ?, ?, ?, ?)',
      [tracking_id, status || 'Picked Up', origin, destination, driver_id || null, vehicle_id || null]
    );
    
    const [newParcel] = await pool.query(`
      SELECT 
        p.*,
        d.name as driver_name,
        v.vehicle_number
      FROM parcels p
      LEFT JOIN drivers d ON p.driver_id = d.id
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newParcel[0]);
  } catch (error) {
    console.error('Error creating parcel:', error);
    res.status(500).json({ error: 'Failed to create parcel' });
  }
});

// Update parcel
router.put('/:id', async (req, res) => {
  try {
    const { tracking_id, status, origin, destination, driver_id, vehicle_id } = req.body;
    const parcelId = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE parcels SET tracking_id = ?, status = ?, origin = ?, destination = ?, driver_id = ?, vehicle_id = ? WHERE id = ?',
      [tracking_id, status, origin, destination, driver_id || null, vehicle_id || null, parcelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    
    const [updatedParcel] = await pool.query(`
      SELECT 
        p.*,
        d.name as driver_name,
        v.vehicle_number
      FROM parcels p
      LEFT JOIN drivers d ON p.driver_id = d.id
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.id = ?
    `, [parcelId]);
    
    res.json(updatedParcel[0]);
  } catch (error) {
    console.error('Error updating parcel:', error);
    res.status(500).json({ error: 'Failed to update parcel' });
  }
});

// Delete parcel
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM parcels WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Parcel not found' });
    }
    
    res.json({ message: 'Parcel deleted successfully' });
  } catch (error) {
    console.error('Error deleting parcel:', error);
    res.status(500).json({ error: 'Failed to delete parcel' });
  }
});

export default router;
