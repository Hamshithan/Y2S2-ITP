import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const [vehicles] = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get single vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicles[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Create new vehicle
router.post('/', async (req, res) => {
  try {
    const { vehicle_number, type, status, capacity } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO vehicles (vehicle_number, type, status, capacity) VALUES (?, ?, ?, ?)',
      [vehicle_number, type, status || 'Active', capacity]
    );
    
    const [newVehicle] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json(newVehicle[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { vehicle_number, type, status, capacity } = req.body;
    const vehicleId = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE vehicles SET vehicle_number = ?, type = ?, status = ?, capacity = ? WHERE id = ?',
      [vehicle_number, type, status, capacity, vehicleId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    const [updatedVehicle] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    res.json(updatedVehicle[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

export default router;
