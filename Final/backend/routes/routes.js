import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const [routes] = await pool.query('SELECT * FROM routes ORDER BY id DESC');
    
    // Get stops for each route
    for (let route of routes) {
      const [stops] = await pool.query(
        'SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order',
        [route.id]
      );
      route.stops_data = stops;
    }
    
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get single route by ID
router.get('/:id', async (req, res) => {
  try {
    const [routes] = await pool.query('SELECT * FROM routes WHERE id = ?', [req.params.id]);
    
    if (routes.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    const route = routes[0];
    
    // Get stops for this route
    const [stops] = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order',
      [route.id]
    );
    route.stops_data = stops;
    
    res.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// Create new route
router.post('/', async (req, res) => {
  try {
    const { route_number, name, start_location, end_location, distance, estimated_time, priority, stops, stops_data } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO routes (route_number, name, start_location, end_location, distance, estimated_time, priority, stops) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [route_number || `ROUTE-${Date.now()}`, name, start_location, end_location, distance, estimated_time, priority || 'Normal', stops || 0]
    );
    
    const routeId = result.insertId;
    
    // Add stops if provided
    if (stops_data && stops_data.length > 0) {
      for (let i = 0; i < stops_data.length; i++) {
        const stop = stops_data[i];
        await pool.query(
          'INSERT INTO route_stops (route_id, location, type, estimated_time, parcels, sequence_order) VALUES (?, ?, ?, ?, ?, ?)',
          [routeId, stop.location, stop.type || 'Delivery', stop.estimated_time, stop.parcels || 0, i + 1]
        );
      }
    }
    
    const [newRoute] = await pool.query('SELECT * FROM routes WHERE id = ?', [routeId]);
    
    // Get stops
    const [stopsList] = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order',
      [routeId]
    );
    newRoute[0].stops_data = stopsList;
    
    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// Update route
router.put('/:id', async (req, res) => {
  try {
    const { route_number, name, start_location, end_location, distance, estimated_time, priority, stops, stops_data } = req.body;
    const routeId = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE routes SET route_number = ?, name = ?, start_location = ?, end_location = ?, distance = ?, estimated_time = ?, priority = ?, stops = ? WHERE id = ?',
      [route_number, name, start_location, end_location, distance, estimated_time, priority, stops, routeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Update stops if provided
    if (stops_data) {
      await pool.query('DELETE FROM route_stops WHERE route_id = ?', [routeId]);
      for (let i = 0; i < stops_data.length; i++) {
        const stop = stops_data[i];
        await pool.query(
          'INSERT INTO route_stops (route_id, location, type, estimated_time, parcels, sequence_order) VALUES (?, ?, ?, ?, ?, ?)',
          [routeId, stop.location, stop.type || 'Delivery', stop.estimated_time, stop.parcels || 0, i + 1]
        );
      }
    }
    
    const [updatedRoute] = await pool.query('SELECT * FROM routes WHERE id = ?', [routeId]);
    
    // Get stops
    const [stopsList] = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order',
      [routeId]
    );
    updatedRoute[0].stops_data = stopsList;
    
    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// Delete route
router.delete('/:id', async (req, res) => {
  try {
    // Route stops will be deleted automatically due to ON DELETE CASCADE
    const [result] = await pool.query('DELETE FROM routes WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;
