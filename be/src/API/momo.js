const express = require('express');
const config = require('config');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken'); 
const Payment = require('../models/Payment'); 
const Customer = require('../models/Customer'); 
const router = express.Router();

// Hàm tạo Token JWT sau khi thanh toán thành công
const generateNewToken = (customer, JWT_SECRET) => {
    return jwt.sign(
        { 
            id: customer.customerId, 
            name: customer.Name, 
            expiryDate: customer.ExpiryDate, 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' } 
    );
};

// 🎯 Route: Tạo URL Thanh toán MoMo
router.post('/create_payment', async (req, res) => {
    try {
        const { paymentId, amount } = req.body; 
        
        // Lấy thông tin cấu hình từ config (Bạn cần đảm bảo đã thêm các khóa này vào file config/default.json)
        const partnerCode = config.get('momo_PartnerCode');
        const accessKey = config.get('momo_AccessKey');
        const secretKey = config.get('momo_SecretKey');
        const redirectUrl = config.get('momo_ReturnUrl'); // URL này trỏ về route /momo/return của backend
        const ipnUrl = config.get('momo_NotifyUrl');       // URL xử lý kết quả tự động (IPN)
        const momoUrl = config.get('momo_PaymentUrl');
        
        // Dữ liệu bắt buộc
        const requestType = 'payWithMethod';
        const orderInfo = 'Thanh toan goi cuoc FilmJS GD:' + paymentId;
        const extraData = ''; 
        const amountMomo = amount;
        
        // orderId và requestId cần phải duy nhất cho mỗi yêu cầu MoMo
        const uniqueSuffix = Date.now();
        const orderId = `${paymentId}_${uniqueSuffix}`; 
        const requestId = `${paymentId}_req_${uniqueSuffix}`; 

        // 1. Tạo chữ ký (Signature) SHA256
        const rawSignature = `accessKey=${accessKey}&amount=${amountMomo}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // 2. Chuẩn bị payload
        const requestBody = {
            partnerCode, accessKey, requestId, amount: amountMomo, orderId, orderInfo, 
            redirectUrl, ipnUrl, requestType, extraData, signature, lang: 'vi'
        };

        // 3. Gọi API MoMo
        const momoResponse = await axios.post(momoUrl, requestBody);
        
        if (momoResponse.data && momoResponse.data.payUrl) {
            console.log(`MoMo URL tạo thành công cho Payment ID: ${paymentId}`);
            res.json({ url: momoResponse.data.payUrl });
        } else {
            console.error('Lỗi MoMo API:', momoResponse.data);
            res.status(500).json({ error: 'Lỗi từ MoMo API: ' + (momoResponse.data.message || 'Không rõ.') });
        }

    } catch (error) {
        console.error('Lỗi khi tạo MoMo payment URL:', error);
        res.status(500).json({ error: 'Lỗi server khi kết nối MoMo.' });
    }
});


// 🎯 Route: Xử lý Kết quả Trả về từ MoMo (redirectUrl)
router.post('/return', async (req, res) => {
    // MoMo gửi kết quả qua POST/Redirect
    const result = req.body;
    const clientReturnBaseUrl = config.get('vnp_ReturnUrlClient'); 
    const JWT_SECRET = process.env.JWT_SECRET; 
    let newToken = '';
    let message = 'Giao dịch thất bại'; 
    let paymentStatus = 'failed';
    
    try {
        // Lấy paymentId gốc từ orderId MoMo (ví dụ: "23_17000000" -> "23")
        const momoOrderId = result.orderId;
        const localPaymentIdString = momoOrderId ? momoOrderId.split('_')[0] : null; 
        const localPaymentIdNumber = parseInt(localPaymentIdString, 10);
        
        // 1. Kiểm tra chữ ký (Bắt buộc)
        // (Thực hiện lại logic hash/signature tại đây để xác thực result)
        // ... (Nếu không xác thực được, coi là failed) ...
        
        // 2. Lấy bản ghi Payment
        const paymentRecord = await Payment.findOne({ paymentId: localPaymentIdNumber });

        if (!paymentRecord) {
            // ... (xử lý lỗi không tìm thấy Payment Record) ...
        } 
        
        const amountReceived = result.amount; 
        
        if (result.resultCode === 0) {
            // Giao dịch thành công (resultCode = 0)
            const newStatus = 'success';
            const transactionId = result.transId;
            
            const updateFields = {
                status: newStatus,
                transactionId: transactionId,
                momoTxnRef: momoOrderId, // Lưu mã orderId của MoMo
                paidAt: new Date(),
                momoResponseCode: result.resultCode
            };

            await Payment.updateOne(
                { paymentId: localPaymentIdNumber, status: 'pending' },
                { $set: updateFields }
            );

            paymentStatus = newStatus;
            message = 'Giao dịch MoMo thành công.';

            // 3. Cấp quyền truy cập (Giống logic VNPay)
            const customer = await Customer.findOne({ customerId: paymentRecord.customerId });
            if (customer && JWT_SECRET) {
                const newExpiryDate = paymentRecord.expiryDate; 
                
                await Customer.updateOne(
                    { customerId: customer.customerId },
                    { $set: { ExpiryDate: newExpiryDate, PriceId: paymentRecord.priceId } }
                );

                const updatedCustomer = await Customer.findOne({ customerId: customer.customerId });
                if (updatedCustomer) {
                    newToken = generateNewToken(updatedCustomer, JWT_SECRET);
                }
            }
        } else {
            // Giao dịch thất bại
            message = `Giao dịch thất bại. Mã lỗi MoMo: ${result.resultCode}`;
            // Bạn có thể update status thành 'failed' ở đây nếu cần theo dõi
        }

    } catch (dbError) {
        console.error('Lỗi DB/Server khi xử lý MoMo return:', dbError);
        message = 'Lỗi xử lý server nội bộ.';
    }
    
    // 4. Chuyển hướng cuối cùng về Frontend
    const finalRedirectUrl = `${clientReturnBaseUrl}/payment?status=${paymentStatus}&amount=${amountReceived}&paymentId=${localPaymentIdNumber}&message=${encodeURIComponent(message)}&token=${newToken}`;
    
    // Sử dụng HTML redirect để đảm bảo chuyển hướng từ POST (MoMo)
    const htmlRedirect = `
        <html><head><title>Chuyển hướng...</title>
        <meta http-equiv="refresh" content="0; url=${finalRedirectUrl}" />
        </head><body><p>Đang chuyển hướng...</p></body></html>
    `;
    res.status(200).send(htmlRedirect);
});

module.exports = router;