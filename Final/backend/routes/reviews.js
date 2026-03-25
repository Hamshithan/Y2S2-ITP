import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all reviews with driver and parcel info
router.get('/', async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT 
        r.*,
        d.name as driver_name,
        p.tracking_id as parcel_tracking_id
      FROM reviews r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN parcels p ON r.parcel_id = p.id
      ORDER BY r.created_at DESC
    `);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single review by ID
router.get('/:id', async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT 
        r.*,
        d.name as driver_name,
        p.tracking_id as parcel_tracking_id
      FROM reviews r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN parcels p ON r.parcel_id = p.id
      WHERE r.id = ?
    `, [req.params.id]);
    
    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(reviews[0]);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Create new review
router.post('/', async (req, res) => {
  try {
    const { customer_name, rating, comment, driver_id, parcel_id } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO reviews (customer_name, rating, comment, driver_id, parcel_id) VALUES (?, ?, ?, ?, ?)',
      [customer_name, rating, comment, driver_id || null, parcel_id || null]
    );
    
    const [newReview] = await pool.query(`
      SELECT 
        r.*,
        d.name as driver_name,
        p.tracking_id as parcel_tracking_id
      FROM reviews r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN parcels p ON r.parcel_id = p.id
      WHERE r.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newReview[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const { customer_name, rating, comment, driver_id, parcel_id, helpful_count } = req.body;
    const reviewId = req.params.id;
    
    const [result] = await pool.query(
      'UPDATE reviews SET customer_name = ?, rating = ?, comment = ?, driver_id = ?, parcel_id = ?, helpful_count = ? WHERE id = ?',
      [customer_name, rating, comment, driver_id || null, parcel_id || null, helpful_count, reviewId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const [updatedReview] = await pool.query(`
      SELECT 
        r.*,
        d.name as driver_name,
        p.tracking_id as parcel_tracking_id
      FROM reviews r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN parcels p ON r.parcel_id = p.id
      WHERE r.id = ?
    `, [reviewId]);
    
    res.json(updatedReview[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Mark review as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      [reviewId]
    );
    
    const [updatedReview] = await pool.query(`
      SELECT 
        r.*,
        d.name as driver_name,
        p.tracking_id as parcel_tracking_id
      FROM reviews r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN parcels p ON r.parcel_id = p.id
      WHERE r.id = ?
    `, [reviewId]);
    
    res.json(updatedReview[0]);
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ error: 'Failed to mark review helpful' });
  }
});

export default router;
