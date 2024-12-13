// --- Backend API (product API) ---
const express = require('express');
const db = require('../db');
const router = express.Router();

// Add product
router.post('/add', (req, res) => {
    const { id, name, prices, tiers } = req.body;

    if (!id || !name || !Array.isArray(prices) || !Array.isArray(tiers) || prices.length !== tiers.length) {
        return res.status(400).json({ message: 'Invalid input: Ensure all fields are provided and arrays match in length' });
    }

    const query = 'INSERT INTO products (id, name, cost, tier) VALUES (?, ?, ?, ?)';

    const promises = prices.map((price, index) => {
        return new Promise((resolve, reject) => {
            db.query(query, [id, name, price, tiers[index]], (err, result) => {
                if (err) reject(err);
                else resolve(result.insertId);
            });
        });
    });

    Promise.all(promises)
        .then(ids => res.status(201).json({ message: 'Products added successfully', productIds: ids }))
        .catch(err => {
            console.error('Error adding products:', err);
            res.status(500).json({ message: 'Server error' });
        });
});

// Update product
router.put('/update', (req, res) => {
    const { id, tier, name, cost } = req.body;
    if (!id || !tier || !name || !cost) {
        return res.status(400).json({ message: 'Invalid input: All fields are required' });
    }

    const query = 'UPDATE products SET name = ?, cost = ? WHERE id = ? AND tier = ?';
    db.query(query, [name, cost, id, tier], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully' });
    });
});

// Delete product
router.delete('/delete', (req, res) => {
    const { id } = req.body;

    // Validate input
    if (!id) {
        return res.status(400).json({ message: 'Invalid input: ID is required' });
    }

    // Delete product from 'products' table
    const deleteProductQuery = 'DELETE FROM products WHERE id = ?';
    db.query(deleteProductQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ message: 'Server error during product deletion' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Proceed to delete related entries in 'show_user_product' table
        const deleteShowUserProductQuery = 'DELETE FROM show_user_product WHERE idproduct = ?';
        db.query(deleteShowUserProductQuery, [id], (err, result) => {
            if (err) {
                console.error('Error deleting associated entries:', err);
                return res.status(500).json({ message: 'Server error during associated entries deletion' });
            }

            // Check if related entries were found
            if (result.affectedRows === 0) {
                console.warn('No associated entries found to delete');
            }

            // Successfully deleted the product and related entries
            return res.status(200).json({ message: 'Product and associated entries deleted successfully' });
        });
    });
});


// Fetch all products
router.get('/', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(200).json(results);
    });
});

// Search products by name and tier
router.get('/search', (req, res) => {
    const { name = '', tier } = req.query;

    let query = 'SELECT * FROM products WHERE name LIKE ?';
    const params = [`%${name}%`];

    if (tier) {
        query += ' AND tier = ?';
        params.push(tier);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error searching products:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(200).json({ message: 'No products found' });
        }

        res.status(200).json(results);
    });
});


module.exports = router;