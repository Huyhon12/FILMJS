const express = require('express');
const Payment = require('../models/Payment'); 
const Customer = require('../models/Customer'); 
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken'); 

// 🎯 Hàm tính toán ngày hết hạn (Dùng để tính ngày hết hạn MỚI)
const calculateNewExpiryDate = (priceId, currentExpiryDate) => {
    let units = 'days'; 
    let duration = 0;
    
    // 1. CHUẨN HÓA priceId (từ số hoặc chuỗi) thành chuỗi chữ thường để so sánh
    const normalizedPriceId = String(priceId || '').toLowerCase().trim(); 

    switch (normalizedPriceId) {
        // Gói 1 THÁNG
        case 'monthly':
        case '1': // <--- Đã thêm xử lý PriceId = 1
            duration = 1;
            units = 'months';
            break;
            
        // Gói 1 NĂM
        case 'yearly':
        case '2': 
            duration = 1;
            units = 'years';
            break;
            
        default:
            console.error(`ERROR: Unknown priceId "${priceId}". Defaulting to 30 days.`);
            duration = 30;
            units = 'days'; 
    }
    
    // 2. Logic tính toán ngày hết hạn 
    let today = moment().startOf('day'); 
    let baseDate = moment(currentExpiryDate); 

    // Nếu ngày hết hạn cũ đã qua HOẶC là null/invalid -> Bắt đầu tính từ ngày hiện tại.
    if (!baseDate.isValid() || baseDate.isSameOrBefore(today, 'second')) {
        baseDate = today; 
    }
    
    return baseDate.add(duration, units).toDate(); 
};


// 🔑 Middleware Auth (Giữ nguyên)
const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Truy cập không hợp lệ: Không tìm thấy token, yêu cầu đăng nhập.' });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const customerIdFromToken = decoded.id; 
        
        if (!customerIdFromToken) {
            return res.status(401).json({ error: 'Token không hợp lệ hoặc thiếu ID người dùng.' });
        }
        // Lấy dữ liệu Customer từ DB
        const customer = await Customer.findOne({ customerId: customerIdFromToken });

        if (!customer) {
            return res.status(401).json({ error: 'Người dùng không tồn tại trong hệ thống.' });
        }
        
        req.user = { 
            _id: customer._id,                 
            customerId: customer.customerId,   
            customer: customer                  // Dữ liệu DB được gán vào đây
        };
        
        next();
    } catch (err) {
        console.error('Lỗi xác thực Token:', err.message);
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};


// 💰 Route: Tạo bản ghi thanh toán mới 
router.post('/create', auth, async (req, res) => {
    try {
        const { amount, priceId, paymentMethod } = req.body;
        
        const customerId = req.user.customerId; 
        const customer = req.user.customer; 

        if (!customerId || !amount || !priceId || !paymentMethod) {
            return res.status(400).json({ error: 'Thiếu các trường bắt buộc để tạo giao dịch.' });
        }
        
        // ... (Giữ nguyên Logic kiểm tra gói cước đang hoạt động) ...
        if (customer.ExpiryDate && moment(customer.ExpiryDate).isSameOrAfter(moment(), 'second')) {
            // ... (Giữ nguyên logic thông báo và format ngày tháng) ...
            
            // 🔥 Phần này chỉ là thông báo lỗi gói cước còn hạn, giữ nguyên
            const expiryDateFromDB = customer.ExpiryDate; 
            const remainingDays = moment(expiryDateFromDB).diff(moment(), 'days') + 1;
            let displayDate = moment(expiryDateFromDB);
            
            if (displayDate.hour() >= 0 && displayDate.hour() <= 7 && displayDate.minute() < 5) {
                displayDate = displayDate.subtract(1, 'day');
            }
            const expiryDateFormatted = displayDate.format('DD/MM/YYYY');
            let detailsMessage = `Thời hạn còn lại: ${remainingDays} ngày (đến ${expiryDateFormatted}).`; 

            return res.status(400).json({ 
                error: `Gói cước của bạn vẫn còn hiệu lực.`,
                details: detailsMessage, 
                isSubscriptionActive: true
            });
        }
        // ... (Kết thúc Logic kiểm tra gói cước đang hoạt động) ...
        
        // 1. TÌM KIẾM GIAO DỊCH PENDING CỦA NGƯỜI DÙNG

        let paymentRecord = await Payment.findOne({
            customerId,
            status: 'pending',
        });

        // Logic tính toán ngày hết hạn thực tế (cho giao dịch mới) 
        const newExpiryDate = calculateNewExpiryDate(
            priceId, 
            customer.ExpiryDate 
        );

        if (paymentRecord) {
            // 2. TÁI SỬ DỤNG GIAO DỊCH CŨ (UPDATE)
            console.log(`Tái sử dụng giao dịch pending cũ ID: ${paymentRecord.paymentId}`);
            
            // Cập nhật các thông tin có thể thay đổi (thời gian hết hạn, số tiền, priceId)
            paymentRecord.amount = amount;
            paymentRecord.priceId = priceId;
            paymentRecord.expiryDate = newExpiryDate; 
            if (paymentRecord.paymentMethod !== paymentMethod) {
        // Nếu người dùng đổi phương thức thanh toán (ví dụ: từ VNPay sang MoMo)

        // Cập nhật phương thức thanh toán mới
        paymentRecord.paymentMethod = paymentMethod;
        
        // Đảm bảo mã giao dịch của phương thức cũ/mới đều là null/undefined
        // vì đây là giao dịch pending MỚI
        paymentRecord.vnpTxnRef = undefined; 
        paymentRecord.momoTxnRef = undefined;
    }
            await paymentRecord.save();
        } else {
            // 3. TẠO GIAO DỊCH MỚI
            paymentRecord = new Payment({
                customerId,
                amount,
                priceId,
                paymentMethod,
                expiryDate: newExpiryDate, 
                status: 'pending', 
            });

            await paymentRecord.save();
        }

        // 4. TRẢ VỀ ID CỦA BẢN GHI ĐÃ TÁI SỬ DỤNG HOẶC MỚI
        res.status(201).json({ 
            message: 'Tạo bản ghi thanh toán thành công.',
            paymentId: paymentRecord.paymentId, 
            amount: paymentRecord.amount
        });

    } catch (error) {
        console.error("Lỗi khi tạo bản ghi thanh toán mới:", error.message);
        // Trả về lỗi 500 nếu gặp E11000
        res.status(500).json({ error: `Lỗi máy chủ nội bộ: ${error.message}` });
    }
});


// 🔄 Route: Cập nhật trạng thái thanh toán (Giữ nguyên)
router.post('/update_status', async (req, res) => {
    try {
        const { paymentId, status, transactionId } = req.body; 

        if (!paymentId || !status) {
            return res.status(400).json({ error: 'Thiếu các trường bắt buộc để cập nhật trạng thái.' });
        }
        
        let updateFields = { status: status };
        if (transactionId) updateFields.transactionId = transactionId;
        
        if (status === 'success') {
            updateFields.paidAt = new Date();
        }

        const updatedPayment = await Payment.findOneAndUpdate(
            { paymentId: paymentId, status: 'pending' }, 
            { $set: updateFields },
            { new: true }
        );

        if (!updatedPayment) {
            return res.status(404).json({ error: 'Không tìm thấy giao dịch hoặc giao dịch đã được xử lý.' });
        }

        console.log(`Trạng thái giao dịch ID ${paymentId} đã cập nhật thành: ${status}`);
        res.json({ message: 'Cập nhật trạng thái thanh toán thành công.' });

    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái thanh toán:", error.message);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi cập nhật trạng thái thanh toán.' });
    }
});


router.get('/revenue', async (req, res) => {
    try {
      const now = new Date();
      const year = parseInt(req.query.year) || now.getFullYear();
      const month = req.query.month ? parseInt(req.query.month) : null; // 1-12 hoặc null
  
      const start = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);
      const end = month
        ? new Date(year, month, 1)
        : new Date(year + 1, 0, 1);
  
      // Dùng đúng field trong DB: paymentDate + status = "success"
      const match = {
        status: 'success',
        paymentDate: { $gte: start, $lt: end },
      };
  
      // Tổng doanh thu + số giao dịch
      const summary = await Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            orderCount: { $sum: 1 },
          },
        },
      ]);
  
      let stats = [];
  
      if (month) {
        // 👉 Có month: group theo ngày
        const dailyAgg = await Payment.aggregate([
          { $match: match },
          {
            $group: {
              _id: { $dayOfMonth: '$paymentDate' },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]);
  
        stats = dailyAgg.map((d) => ({
          day: d._id,
          total: d.total,
        }));
      } else {
        // 👉 Không có month: group theo tháng
        const monthlyAgg = await Payment.aggregate([
          { $match: match },
          {
            $group: {
              _id: { $month: '$paymentDate' },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]);
  
        stats = monthlyAgg.map((d) => ({
          month: d._id,
          total: d.total,
        }));
      }
  
      const s = summary[0] || { totalRevenue: 0, orderCount: 0 };
  
      res.json({
        year,
        month: month || null,
        totalRevenue: s.totalRevenue,
        orderCount: s.orderCount,
        stats,
      });
    } catch (error) {
      console.error('Lỗi lấy doanh thu:', error.message);
      res.status(500).json({ error: 'Lỗi khi lấy doanh thu' });
    }
  });

module.exports = router;