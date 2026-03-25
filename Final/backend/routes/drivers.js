import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const [drivers] = await pool.query('SELECT * FROM drivers ORDER BY id DESC');
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get single driver by ID
router.get('/:id', async (req, res) => {
  try {
    const [drivers] = await pool.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(drivers[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// Create new driver
router.post('/', async (req, res) => {
  try {
    const { name, phone, license_number, status } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO drivers (name, phone, license_number, status) VALUES (?, ?, ?, ?)',
      [name, phone, license_number, status || 'Active']
    );
    
    const [newDriver] = await pool.query('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
    res.status(201).json(newDriver[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Update driver
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, license_number, status } = req.body;
    const driverId = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE drivers SET name = ?, phone = ?, license_number = ?, status = ? WHERE id = ?',
      [name, phone, license_number, status, driverId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    const [updatedDriver] = await pool.query('SELECT * FROM drivers WHERE id = ?', [driverId]);
    res.json(updatedDriver[0]);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

export default router;
