const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // Database connection
const productRoutes = require('./router/products');
const customerRoutes = require('./router/customers');
const linkRoutes = require('./router/links');
// const profitRoutes = require('./routes/profits');

const app = express();
const port = 8000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/products', productRoutes);
app.use('/customer', customerRoutes);
app.use('/links', linkRoutes);
// app.use('/profits', profitRoutes);

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
