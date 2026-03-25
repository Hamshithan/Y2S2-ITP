import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customers[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { customer_id, name, email, phone, purchases, total_spent, discount_percent, tier, eligible_for_offer } = req.body;
    
    // Auto-calculate tier based on purchases if not provided
    let customerTier = tier;
    if (!customerTier) {
      if (purchases >= 40) customerTier = 'Platinum';
      else if (purchases >= 20) customerTier = 'Gold';
      else if (purchases >= 10) customerTier = 'Silver';
      else if (purchases >= 5) customerTier = 'Bronze';
      else customerTier = 'Member';
    }
    
    // Auto-calculate discount based on tier
    let customerDiscount = discount_percent;
    if (!customerDiscount) {
      const tierDiscounts = { 'Platinum': 20, 'Gold': 15, 'Silver': 10, 'Bronze': 5, 'Member': 0 };
      customerDiscount = tierDiscounts[customerTier] || 0;
    }
    
    const [result] = await pool.query(
      'INSERT INTO customers (customer_id, name, email, phone, purchases, total_spent, discount_percent, tier, eligible_for_offer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id || `CUST-${Date.now()}`, name, email, phone, purchases || 0, total_spent || 0, customerDiscount, customerTier, eligible_for_offer || false]
    );
    
    const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { customer_id, name, email, phone, purchases, total_spent, discount_percent, tier, eligible_for_offer } = req.body;
    const customerId = req.params.id;
    
    // Auto-calculate tier based on purchases if tier not provided
    let customerTier = tier;
    if (purchases !== undefined && !tier) {
      if (purchases >= 40) customerTier = 'Platinum';
      else if (purchases >= 20) customerTier = 'Gold';
      else if (purchases >= 10) customerTier = 'Silver';
      else if (purchases >= 5) customerTier = 'Bronze';
      else customerTier = 'Member';
    }
    
    // Auto-calculate discount based on tier
    let customerDiscount = discount_percent;
    if (customerTier && !discount_percent) {
      const tierDiscounts = { 'Platinum': 20, 'Gold': 15, 'Silver': 10, 'Bronze': 5, 'Member': 0 };
      customerDiscount = tierDiscounts[customerTier] || 0;
    }
    
    const [result] = await pool.query(
      'UPDATE customers SET customer_id = ?, name = ?, email = ?, phone = ?, purchases = ?, total_spent = ?, discount_percent = ?, tier = ?, eligible_for_offer = ? WHERE id = ?',
      [customer_id, name, email, phone, purchases, total_spent, customerDiscount, customerTier, eligible_for_offer, customerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const [updatedCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Add purchase to customer
router.post('/:id/purchase', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { amount } = req.body;
    
    await pool.query(
      'UPDATE customers SET purchases = purchases + 1, total_spent = total_spent + ? WHERE id = ?',
      [amount || 0, customerId]
    );
    
    // Recalculate tier based on new purchase count
    const [customers] = await pool.query('SELECT purchases FROM customers WHERE id = ?', [customerId]);
    if (customers.length > 0) {
      const purchases = customers[0].purchases;
      let newTier = 'Member';
      if (purchases >= 40) newTier = 'Platinum';
      else if (purchases >= 20) newTier = 'Gold';
      else if (purchases >= 10) newTier = 'Silver';
      else if (purchases >= 5) newTier = 'Bronze';
      
      const tierDiscounts = { 'Platinum': 20, 'Gold': 15, 'Silver': 10, 'Bronze': 5, 'Member': 0 };
      const newDiscount = tierDiscounts[newTier];
      
      await pool.query(
        'UPDATE customers SET tier = ?, discount_percent = ? WHERE id = ?',
        [newTier, newDiscount, customerId]
      );
    }
    
    const [updatedCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ error: 'Failed to add purchase' });
  }
});

export default router;
