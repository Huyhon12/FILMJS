const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./DatabaseConfig/db');

const app = express();
const PORT = 5000;
dotenv.config();

app.use(cors());
app.use(express.json());

// Kết nối MongoDB
db();

// Định nghĩa các router
const movieRouter = require('./API/movie');
const customerRouter = require('./API/customer');
const watchlistRouter = require('./API/watchlist');
const watchhistoryRouter = require('./API/watchhistory');
const priceRouter = require('./API/price');
const vnpayRouter = require('./API/vnpay');
const paymentRouter = require('./API/payment');

// Sử dụng router
app.use('/api/movies', movieRouter);
app.use('/api/customers', customerRouter);
app.use('/api/watchlists' , watchlistRouter);
app.use('/api/watchhistory' ,watchhistoryRouter);
app.use('/api/prices', priceRouter);
app.use('/api/vnpay', vnpayRouter);
app.use('/api/payment', paymentRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});