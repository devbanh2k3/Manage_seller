const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
var cors = require('cors')


// Khởi tạo ứng dụng Express
const app = express();
const port = 8000;

// Middleware để phân tích JSON trong request body
app.use(bodyParser.json());
app.use(express.json());

app.use(cors());

// Kết nối đến MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // thay bằng tên người dùng MySQL của bạn
    password: '', // thay bằng mật khẩu MySQL của bạn
    database: 'db_manage_seller'
});

// Kiểm tra kết nối MySQL
db.connect(err => {
    if (err) {
        console.error('Lỗi kết nối đến cơ sở dữ liệu:', err);
        return;
    }
    console.log('Kết nối thành công đến MySQL!');
});

// Bảng Product
// API để thêm sản phẩm vào bảng "products"
app.post('/add-product', (req, res) => {
    const { id, name, prices, tiers } = req.body;

    // Kiểm tra xem tất cả các trường cần thiết có được gửi qua hay không
    if (!name || !id || !prices || !tiers || !Array.isArray(prices) || !Array.isArray(tiers)) {
        return res.status(400).json({ message: 'Missing required fields or prices/tiers must be arrays' });
    }

    // Đảm bảo số lượng giá và tier bằng nhau
    if (prices.length !== tiers.length) {
        return res.status(400).json({ message: 'Prices and tiers arrays must have the same length' });
    }

    // Chuẩn bị câu lệnh SQL
    const query = `INSERT INTO products (id, name, cost, tier) VALUES ( ?, ?, ?, ?)`;

    // Thực hiện thêm nhiều dòng dữ liệu
    const queries = prices.map((price, index) => {
        const tier = tiers[index];
        return new Promise((resolve, reject) => {
            db.query(query, [id, name, price, tier], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.insertId);
                }
            });
        });
    });

    // Xử lý tất cả các lời hứa
    Promise.all(queries)
        .then(ids => {
            res.status(201).json({
                message: 'Products added successfully',
                productIds: ids, // Trả về danh sách các ID sản phẩm được thêm
            });
        })
        .catch(err => {
            console.error('Lỗi khi thêm sản phẩm:', err);
            res.status(500).json({ message: 'Lỗi server' });
        });
});

app.put('/update-product', (req, res) => {
    const { id, tier, name, cost } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!id || !tier || !name || !cost) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Câu lệnh SQL để cập nhật sản phẩm
    const query = `UPDATE products SET name = ?, cost = ? WHERE id = ? AND tier = ?`;

    db.query(query, [name, cost, id, tier], (err, result) => {
        if (err) {
            console.error('Lỗi khi cập nhật sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully' });
    });
});

app.delete('/delete-product', (req, res) => {
    const { id } = req.body;

    // Kiểm tra xem thông tin có đầy đủ không
    if (!id) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Câu lệnh SQL để xóa sản phẩm
    const query = `DELETE FROM products WHERE id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Lỗi khi xóa sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    });
});

app.get('/products/:id', (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM products WHERE id = ?`;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Products not found' });
        }

        res.status(200).json(results);
    });
});
app.get('/api/products', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            res.status(500).json({ message: 'Lỗi server' });
        } else {
            res.status(200).json(results);
        }
    });
});

app.get('/api/products_search', (req, res) => {
    const searchName = req.query.name || '';
    const searchTier = req.query.tier || ''; // Tham số tìm kiếm tier
    let query = 'SELECT * FROM products WHERE name LIKE ?';
    const queryParams = [`%${searchName}%`];

    // Nếu có tier, thêm điều kiện
    if (searchTier) {
        query += ' AND tier = ?';
        queryParams.push(searchTier);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            res.status(500).json({ message: 'Lỗi server' });
        } else {
            res.status(200).json(results);
        }
    });
});

//kết thúc Bảng product

//Bảng Customer

app.post('/add-customer', (req, res) => {
    const { store, user, password, domain, ga, linkga, tier } = req.body;

    // Kiểm tra xem tất cả các trường cần thiết có được gửi qua hay không
    if (!store || !user || !password || !domain || !ga || !linkga || !tier) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Câu lệnh SQL để thêm sản phẩm vào bảng "products"
    const query = `INSERT INTO customer (store, user, password, domain, ga, linkga, tier) VALUES(?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [store, user, password, domain, ga, linkga, tier], (err, result) => {
        if (err) {
            console.error('Lỗi khi thêm khách hàng:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        res.status(201).json({
            message: 'Customer added successfully',
            productId: result.insertId,
        });
    });
});

app.put('/update-customer', (req, res) => {
    const { id, store, user, password, domain, ga, linkga, tier } = req.body;

    // Kiểm tra nếu không có `id`, trả về lỗi
    if (!id) {
        return res.status(400).json({ message: 'Missing required ID' });
    }

    // Khởi tạo mảng để lưu các cặp trường và giá trị
    let fields = [];
    let values = [];

    // Thêm các trường và giá trị không rỗng vào mảng
    if (store) { fields.push('store = ?'); values.push(store); }
    if (user) { fields.push('user = ?'); values.push(user); }
    if (password) { fields.push('password = ?'); values.push(password); }
    if (domain) { fields.push('domain = ?'); values.push(domain); }
    if (ga) { fields.push('ga = ?'); values.push(ga); }
    if (linkga) { fields.push('linkga = ?'); values.push(linkga); }
    if (tier) { fields.push('tier = ?'); values.push(tier); }

    // Nếu không có trường nào để cập nhật, trả về lỗi
    if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }

    // Thêm `id` vào mảng giá trị để sử dụng trong điều kiện WHERE
    values.push(id);

    // Xây dựng câu lệnh SQL động
    const query = `UPDATE customer SET ${fields.join(', ')} WHERE id = ?`;

    // Thực hiện truy vấn
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Lỗi khi cập nhật sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json({ message: 'Customer updated successfully' });
    });
});

app.delete('/delete-customer', (req, res) => {
    const { id } = req.body;

    // Kiểm tra xem thông tin có đầy đủ không
    if (!id) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Câu lệnh SQL để xóa sản phẩm
    const query = `DELETE FROM customer WHERE id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Lỗi khi xóa khách hàng:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Khách hàng not found' });
        }

        res.status(200).json({ message: 'Customer deleted successfully' });
    });
});

app.get('/customer/:id', (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM customer WHERE id = ?`;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(results);
    });
});
app.get('/customer', (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM customer`;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(results);
    });
});
//kết thúc Bảng Customer

//Bảng danh sách link
app.post('/add-link', (req, res) => {

    const { idseller, idtier, idproduct, link, cost, store, product } = req.body;
    const costDecimal = parseFloat(cost);
    // Kiểm tra xem tất cả các trường cần thiết có được gửi qua hay không
    if (!idseller || !idtier || !idproduct || !link || !costDecimal || !store || !product) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Câu lệnh SQL để thêm sản phẩm vào bảng "products"
    const query = `INSERT INTO show_user_product (idseller, idtier, idproduct, link, cost, store, product) VALUES(?, ?, ?, ?, ?, ?,?)`;

    db.query(query, [idseller, idtier, idproduct, link.trim(), costDecimal, store, product], (err, result) => {
        if (err) {
            console.error('Lỗi khi thêm Link:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        res.status(201).json({
            message: 'Links added successfully',
            productId: result.insertId,
        });
    });
});
app.get('/links/:idseller', (req, res) => {
    const { idseller } = req.params;

    const query = `SELECT * FROM show_user_product WHERE idseller = ?`;

    db.query(query, [idseller], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(results);
    });
});


app.get('/links-sort', (req, res) => {
    const { link, store } = req.query; // Lấy thông tin link và store từ query string

    // Kiểm tra xem có truyền thông tin đầy đủ hay không
    if (!link || !store) {
        return res.status(400).json({
            message: 'Link and store are required'
        });
    }

    // SQL Query an toàn với placeholders
    const query = `
        SELECT * FROM show_user_product 
        WHERE link = ? AND store = ?
    `;

    // Thực thi câu lệnh SQL
    db.query(query, [link, store], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            return res.status(500).json({
                message: 'Lỗi server'
            });
        }

        // Kiểm tra nếu không có kết quả
        if (results.length === 0) {
            return res.status(200).json({
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Trả về dữ liệu kết quả
        res.status(200).json({
            success: true,
            data: results
        });
    });
});
//kết thúc Bảng links

// Bảng Profit
app.post('/add-profit', (req, res) => {
    const { transaction_date, idSeller, store, product_name, profit_on_store, cost, profit, exchange_rate, total_amount, link } = req.body;
    // Kiểm tra xem tất cả các trường cần thiết có được gửi qua hay không
    if (!transaction_date || !idSeller || !store || !product_name || !profit_on_store || !cost || !profit || !exchange_rate || !total_amount || !link) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // check trùng 
    const query_check = `
    SELECT * FROM sales_data 
    WHERE transaction_date = ? AND idSeller = ? AND store = ? AND product_name = ?AND profit_on_store = ?AND cost = ?AND profit = ?AND exchange_rate = ? AND total_amount = ?  AND link = ?
    `;

    // Thực thi câu lệnh SQL
    db.query(query_check, [transaction_date, idSeller, store, product_name, profit_on_store, cost, profit, exchange_rate, total_amount, link], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm:', err);
            return res.status(500).json({
                message: 'Lỗi server'
            });
        }

        // Kiểm tra nếu không có kết quả
        if (results.length > 0) {
            return res.status(200).json({
                message: 'Dữ liệu trùng lặp'
            });
        }
        console.log(transaction_date)
        // Câu lệnh SQL để thêm sản phẩm vào bảng "products"
        const query = `INSERT INTO sales_data (transaction_date, idSeller, store, product_name, profit_on_store, cost, profit,exchange_rate,total_amount, link) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ? ,?)`;

        db.query(query, [transaction_date, idSeller, store, product_name, profit_on_store, cost, profit, exchange_rate, total_amount, link], (err, result) => {
            if (err) {
                console.error('Lỗi khi thêm profit:', err);
                return res.status(500).json({ message: 'Lỗi server' });
            }

            res.status(201).json({
                message: 'Profit added successfully',
                productId: result.insertId,
            });
        });
    });







});


// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
