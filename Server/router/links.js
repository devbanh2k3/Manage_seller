// routes/links.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// Add link
router.post('/add', (req, res) => {
    const { idseller, idtier, idproduct, link, cost, store, product } = req.body;

    if (!idseller || !idtier || !idproduct || !link || !cost || !store || !product) {
        return res.status(400).json({ message: 'Invalid input: All fields are required' });
    }

    const query = 'INSERT INTO show_user_product (idseller, idtier, idproduct, link, cost, store, product) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [idseller, idtier, idproduct, link.trim(), parseFloat(cost), store, product], (err, result) => {
        if (err) {
            console.error('Error adding link:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        res.status(201).json({ message: 'Link added successfully', linkId: result.insertId });
    });
});


// Fetch sorted links by link and store
router.get('/sort', async (req, res) => {
    const { link, store } = req.query;
    console.log(link)
    if (!link || !store) {
        return res.status(400).json({ message: 'Invalid input: Link and store are required' });
    }

    try {
        // Truy vấn dữ liệu từ bảng `show_user_product`
        const query = 'SELECT * FROM show_user_product WHERE link = ? AND store = ?';
        const linksResults = await new Promise((resolve, reject) => {
            db.query(query, [link, store], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        if (linksResults.length === 0) {
            return res.status(200).json({ message: 'No links found' });
        }

        // Lấy chi tiết sản phẩm từ bảng `products`
        const fetchProductDetails = linksResults.map((link) => {
            return new Promise((resolve, reject) => {
                const queryProduct = 'SELECT * FROM products WHERE id = ? AND tier = ?';
                db.query(queryProduct, [link.idproduct, link.idtier], (err, productResults) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Kết hợp dữ liệu từ `show_user_product` với chi tiết sản phẩm
                        resolve({
                            ...link,
                            productDetails: productResults.length > 0 ? productResults[0] : null,
                        });
                    }
                });
            });
        });

        // Chờ tất cả các truy vấn chi tiết sản phẩm hoàn thành
        const enrichedLinks = await Promise.all(fetchProductDetails);

        // Trả kết quả về client
        res.status(200).json({ data: enrichedLinks });
    } catch (error) {
        console.error('Error fetching sorted links:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




// Fetch links by seller ID
router.get('/:idseller', (req, res) => {
    const { idseller } = req.params;

    const query = 'SELECT * FROM show_user_product WHERE idseller = ?';
    db.query(query, [idseller], (err, results) => {
        if (err) {
            console.error('Error fetching links:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No links found for the seller' });
        }
        const query3 = 'SELECT * FROM customer WHERE id = ?';
        db.query(query3, [results.idseller], (err, results3) => {
            if (err) {
                console.error('Error fetching links:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (results2.length === 0) {
                return res.status(404).json({ message: 'No links found for the seller' });
            }




            const tier = results3.tier;
            const query2 = 'SELECT * FROM products WHERE id = ? AND tier=?';
            db.query(query2, [results.idproduct, tier], (err, results2) => {
                if (err) {
                    console.error('Error fetching links:', err);
                    return res.status(500).json({ message: 'Server error' });
                }

                if (results2.length === 0) {
                    return res.status(404).json({ message: 'No links found for the seller' });
                }



                res.status(200).json(results);
            });



        });





    });
});


router.get('/api/:idseller', (req, res) => {
    const { idseller } = req.params;

    // Query to fetch links by seller ID
    const queryLinks = 'SELECT * FROM show_user_product WHERE idseller = ?';

    db.query(queryLinks, [idseller], (err, linksResults) => {
        if (err) {
            console.error('Error fetching links:', err);
            return res.status(500).json({ message: 'Server error while fetching links.' });
        }

        if (linksResults.length === 0) {
            return res.status(200).json([]);
        }

        // Query to fetch customer details for the seller
        const queryCustomer = 'SELECT * FROM customer WHERE id = ?';
        db.query(queryCustomer, [idseller], (err, customerResults) => {
            if (err) {
                console.error('Error fetching customer:', err);
                return res.status(500).json({ message: 'Server error while fetching customer.' });
            }

            if (customerResults.length === 0) {
                return res.status(404).json({ message: 'Customer not found.' });
            }

            const tier = customerResults[0].tier;

            // Prepare enriched results
            const enrichedLinks = [];

            // Fetch product details for each link and enrich the data
            const fetchProductDetails = linksResults.map((link) => {
                return new Promise((resolve, reject) => {
                    const queryProduct = 'SELECT * FROM products WHERE id = ? AND tier = ?';
                    db.query(queryProduct, [link.idproduct, tier], (err, productResults) => {
                        if (err) {
                            reject(err);
                        } else {
                            if (productResults.length > 0) {
                                resolve({ ...link, productDetails: productResults[0] });
                            } else {
                                resolve({ ...link, productDetails: null });
                            }
                        }
                    });
                });
            });

            // Resolve all promises and send the response
            Promise.all(fetchProductDetails)
                .then((enrichedResults) => {
                    res.status(200).json({
                        seller: customerResults[0],
                        links: enrichedResults,
                    });
                })
                .catch((error) => {
                    console.error('Error enriching links:', error);
                    res.status(500).json({ message: 'Server error while enriching links.' });
                });
        });
    });
});



router.delete('/delete', (req, res) => {
    const { link, store } = req.body;
    console.log(link)
    if (!link || !store) {
        return res.status(400).json({ message: 'Invalid input: link and store are required' });
    }

    const query = 'DELETE FROM show_user_product WHERE link = ? AND store = ?';
    db.query(query, [link.trim(), store], (err, result) => {
        if (err) {
            console.error('Error deleting link:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Link or store not found' });
        }

        res.status(200).json({ message: 'Link deleted successfully' });
    });
});



router.post('/add-profit', async (req, res) => {
    const {
        transaction_date,
        idSeller,
        store,
        product_name,
        profit_on_store,
        cost,
        profit,
        exchange_rate,
        total_amount,
        link
    } = req.body;

    // Kiểm tra xem tất cả các trường cần thiết có được gửi qua hay không
    if (!transaction_date || !idSeller || !store || !product_name || !profit_on_store || !cost || !profit || !exchange_rate || !total_amount || !link) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Kiểm tra xem dữ liệu đã tồn tại hay chưa
        const queryCheck = `
            SELECT * FROM sales_data 
            WHERE transaction_date = ? AND idSeller = ? AND store = ? AND product_name = ? 
            AND profit_on_store = ? AND cost = ? AND profit = ? AND exchange_rate = ? 
            AND total_amount = ? AND link = ?
        `;

        const existingData = await new Promise((resolve, reject) => {
            db.query(queryCheck, [
                transaction_date, idSeller, store, product_name, profit_on_store,
                cost, profit, exchange_rate, total_amount, link
            ], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Nếu dữ liệu trùng lặp, trả về thông báo
        if (existingData.length > 0) {
            return res.status(409).json({ message: 'Duplicate data found' });
        }

        // Thêm dữ liệu mới vào bảng sales_data
        const queryInsert = `
            INSERT INTO sales_data (
                transaction_date, idSeller, store, product_name, 
                profit_on_store, cost, profit, exchange_rate, total_amount, link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertResult = await new Promise((resolve, reject) => {
            db.query(queryInsert, [
                transaction_date, idSeller, store, product_name, profit_on_store,
                cost, profit, exchange_rate, total_amount, link
            ], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        // Trả về kết quả thành công
        res.status(201).json({
            message: 'Profit added successfully',
            productId: insertResult.insertId
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/statistics/:idSeller', async (req, res) => {
    const { idSeller } = req.params; // Đổi tên biến cho rõ ràng
    console.log(`Fetching statistics for seller ID: ${idSeller}`);

    const query = 'SELECT * FROM sales_data WHERE idSeller = ?';

    db.query(query, [idSeller], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'No statistics found for the given seller ID' });
        }

        res.status(200).json(results); // Trả về toàn bộ kết quả
    });
});


module.exports = router;