const express = require('express');
const db = require('../db');
const router = express.Router();

// Add customer
router.post('/add', (req, res) => {
    const { store, user, password, domain, ga, linkga, tier } = req.body;

    if (!store || !user || !password || !domain || !ga || !linkga || !tier) {
        return res.status(400).json({ message: 'Invalid input: All fields are required' });
    }

    const query = 'INSERT INTO customer (store, user, password, domain, ga, linkga, tier) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [store, user, password, domain, ga, linkga, tier], (err, result) => {
        if (err) {
            console.error('Error adding customer:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        res.status(201).json({ message: 'Customer added successfully', customerId: result.insertId });
    });
});

// Update customer
router.put('/update', (req, res) => {


    const { id, store, user, password, domain, ga, linkga, tier } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Invalid input: ID is required' });
    }

    const updates = [];
    const values = [];

    if (store) { updates.push('store = ?'); values.push(store); }
    if (user) { updates.push('user = ?'); values.push(user); }
    if (password) { updates.push('password = ?'); values.push(password); }
    if (domain) { updates.push('domain = ?'); values.push(domain); }
    if (ga) { updates.push('ga = ?'); values.push(ga); }
    if (linkga) { updates.push('linkga = ?'); values.push(linkga); }
    if (tier) { updates.push('tier = ?'); values.push(tier); }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'Invalid input: No fields to update' });
    }

    values.push(id);
    const query = `UPDATE customer SET ${updates.join(', ')} WHERE id = ?`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating customer:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const query2 = 'UPDATE show_user_product SET idtier = ? WHERE idseller = ?';
        db.query(query2, [tier, id], (err, result2) => {
            if (err) {
                console.error('Error updating idtier:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (result2.affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            res.status(200).json({ message: 'idtier updated successfully' });
        });



    });
});

// Delete customer
router.delete('/delete', (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Invalid input: ID is required' });
    }

    // First query to delete the customer
    const deleteCustomerQuery = 'DELETE FROM customer WHERE id = ?';
    db.query(deleteCustomerQuery, [id], (err, customerResult) => {
        if (err) {
            console.error('Error deleting customer:', err);
            return res.status(500).json({ message: 'Server error while deleting customer' });
        }

        if (customerResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Second query to delete related links in show_user_product
        const deleteLinksQuery = 'DELETE FROM show_user_product WHERE idseller = ?';
        db.query(deleteLinksQuery, [id], (err, linksResult) => {
            if (err) {
                console.error('Error deleting related links:', err);
                return res.status(500).json({ message: 'Server error while deleting related links' });
            }

            res.status(200).json({
                message: 'Customer and related links deleted successfully',
                deletedCustomerRows: customerResult.affectedRows,
                deletedLinkRows: linksResult.affectedRows,
            });
        });
    });
});


// Fetch all customers
router.get('/', (req, res) => {
    const query = 'SELECT * FROM customer';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(200).json(results);
    });
});

// Fetch customer by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM customer WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching customer:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(results[0]);
    });
});

module.exports = router;
