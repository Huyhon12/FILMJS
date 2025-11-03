const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

router.post('/register', async (req, res) => {
    const { Name, Email, Phone, Password } = req.body; 

    try {
        const existingCustomer = await Customer.findOne({ Email: Email });
        if (existingCustomer) {
            return res.status(400).json({ message: 'Email đã được sử dụng. Vui lòng chọn email khác.' });
        }
        const existingNameCustomer = await Customer.findOne({ Name: Name });
        if (existingNameCustomer) {
            return res.status(400).json({ message: 'Tên đăng nhập đã được sử dụng !' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Password, saltRounds); 

        const newCustomer = new Customer({
            Name: Name,         
            Email: Email,       
            Phone: Phone,       
            Password: hashedPassword 
        });
        
        await newCustomer.save();
        res.status(201).json({ message: 'Tài khoản đã được tạo thành công! Bạn có thể đăng nhập.' });
    } catch (err) {
        console.error('Registration Error:', err); 
        res.status(500).json({ message: 'Lỗi máy chủ: ' + err.message }); 
    }
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

router.post('/login', async (req, res) => {
    const { Name, Password } = req.body;

    try {
        const existingCustomer = await Customer.findOne({ Name: Name });
        if (!existingCustomer) {
            return res.status(404).json({ message: "Tên tài khoản không tồn tại" });
        }

        const isMatch = await bcrypt.compare(Password, existingCustomer.Password); 
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không đúng" });
        }

        // Tạo JWT
        const token = jwt.sign({ id: existingCustomer.customerId, name: existingCustomer.Name, expiryDate: existingCustomer.ExpiryDate }, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            message: "Đăng nhập thành công!",
            token,
            user: {
                id: existingCustomer.customerId, 
                name: existingCustomer.Name,
                email: existingCustomer.Email,
                phone: existingCustomer.Phone,
                expiryDate: existingCustomer.ExpiryDate, 
                priceId: existingCustomer.PriceId,
            },
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});

router.post('/reset-password-simple', async (req, res) => {
    const { Name, Email, newPassword } = req.body;
    if (!Name || !Email || !newPassword) {
        return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ Tên đăng nhập, Email và Mật khẩu mới." });
    }


    try {
        const customer = await Customer.findOne({ 
            Name: Name, 
            Email: Email 
        });
        
        if (!customer) {
            return res.status(404).json({ message: "Tên đăng nhập hoặc Email không đúng." });
        }

        // 2. Hash và cập nhật Mật khẩu mới
        const saltRounds = 10;
        customer.Password = await bcrypt.hash(newPassword, saltRounds);
        
        await customer.save();

        res.status(200).json({ message: "Mật khẩu đã được đổi thành công!" });

    } catch (err) {
        console.error('Simple Reset Password Error:', err);
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
});
module.exports = router;