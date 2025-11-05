const express = require('express');
const config = require('config');
const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');
const jwt = require('jsonwebtoken');
const Payment = require('../models/Payment'); 
const Customer = require('../models/Customer'); 

const router = express.Router();

function sortObject(obj) {
    let sorted = {};
    let str = Object.keys(obj);
    
    str.sort();

    for (let key of str) {
        // Đảm bảo mã hóa cho VNPAY
        if (obj[key] !== undefined && obj[key] !== null) {
            sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
        }
    }
    return sorted;
}

// ... (Router.post('/create_payment_url', ...) GIỮ NGUYÊN) ...

router.post('/create_payment_url', (req, res) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh'; 

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    
    const ipAddr = req.headers['x-forwarded-for'] || req.ip;

    const tmnCode = config.get('vnp_TmnCode');
    const secretKey = config.get('vnp_HashSecret');
    let vnpUrl = config.get('vnp_Url');
    const returnUrl = config.get('vnp_ReturnUrl');
    
    const { orderId: paymentId, amount, bankCode = '', language = 'vn' } = req.body; 

    if (!paymentId || !amount) {
          return res.status(400).json({ error: 'Thiếu tham số bắt buộc: mã giao dịch (paymentId) hoặc số tiền (amount)' });
    }

    const currCode = 'VND';
    let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: language,
        vnp_CurrCode: currCode,
        vnp_TxnRef: paymentId, 
        vnp_OrderInfo: 'Thanh toan cho ma GD:' + paymentId,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false }); 

    console.log('Generated VNPay URL for Payment ID:', paymentId);
    res.json({ url: vnpUrl });
});


router.get('/vnpay_return', async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    const secretKey = config.get('vnp_HashSecret');
    const clientReturnBaseUrl = config.get('vnp_ReturnUrlClient'); 
    const JWT_SECRET = process.env.JWT_SECRET;
    
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    
    // ... (Log DEBUG giữ nguyên) ...

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    // ... (Log Hash giữ nguyên) ...

    let paymentStatus = 'error'; 
    let amountReceived = vnp_Params['vnp_Amount'] ? parseInt(vnp_Params['vnp_Amount'], 10) / 100 : 0; 
    let paymentId = vnp_Params['vnp_TxnRef'];
    let transactionId = vnp_Params['vnp_TransactionNo'];
    let vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
    let message = 'Giao dịch thất bại'; 
    
    let newToken = ''; // 👈 Biến để lưu Token mới

    if (secureHash === signed) {
        try {
            const paymentRecord = await Payment.findOne({ paymentId: paymentId });

            if (!paymentRecord) {
                // ... (xử lý lỗi không tìm thấy Payment Record giữ nguyên) ...
            } 
            else if (paymentRecord.amount !== amountReceived) {
                // ... (xử lý lỗi sai lệch số tiền giữ nguyên) ...
            } 
            else if (paymentRecord.status !== 'pending') {
                // ... (xử lý lỗi giao dịch đã xử lý giữ nguyên) ...
                if (paymentRecord.status === 'success') {
                    // Nếu đã thành công trước đó, cố gắng tạo lại token (phòng trường hợp client mất token)
                    const customer = await Customer.findOne({ customerId: paymentRecord.customerId });
                    if (customer && JWT_SECRET) {
                        newToken = jwt.sign(
                            { id: customer.customerId, name: customer.Name, expiryDate: customer.ExpiryDate }, 
                            JWT_SECRET
                        );
                    }
                }
            } 
            else {
                const newStatus = (vnp_ResponseCode === '00') ? 'success' : 'failed';
                message = (newStatus === 'success') ? 'Giao dịch thành công' : `Giao dịch thất bại. Mã lỗi: ${vnp_ResponseCode}`;
                
                let vnpTxnRefValue = vnp_Params['vnp_TxnRef'];
                
                const updateFields = {
                    status: newStatus,
                    transactionId: transactionId,
                    vnpTxnRef: vnpTxnRefValue,
                    paidAt: (newStatus === 'success') ? new Date() : undefined,
                    vnpResponseCode: vnp_ResponseCode
                };

                await Payment.updateOne({ paymentId: paymentId }, { $set: updateFields });
                
                paymentStatus = newStatus;

                // Cấp quyền truy cập nếu thành công
                if (newStatus === 'success') {
                    const customerId = paymentRecord.customerId;

                    const customer = await Customer.findOne({ customerId: customerId });
                    
                    if (!customer) {
                        // ... (xử lý lỗi không tìm thấy Customer giữ nguyên) ...
                    } else {
                        const newExpiryDate = paymentRecord.expiryDate; 
                        
                        // Ánh xạ priceId (String) sang PriceId (Number)
                        let mappedPriceId = 0; 
                        if (paymentRecord.priceId === 'monthly') mappedPriceId = 1;
                        if (paymentRecord.priceId === 'yearly') mappedPriceId = 2;

                        await Customer.updateOne(
                            { customerId: customerId },
                            { $set: { ExpiryDate: newExpiryDate, PriceId: mappedPriceId } }
                        );
                        
                        // 🔥 BƯỚC MỚI: TẠO TOKEN MỚI
                        const updatedCustomer = await Customer.findOne({ customerId: customerId }); // Lấy lại Customer đã cập nhật
                        
                        if (updatedCustomer && JWT_SECRET) {
                            newToken = jwt.sign(
                                { 
                                    id: updatedCustomer.customerId, 
                                    name: updatedCustomer.Name,
                                    expiryDate: updatedCustomer.ExpiryDate, 
                                }, 
                                JWT_SECRET
                            );
                            console.log('SUCCESS: Generated new JWT with ExpiryDate.');
                        } else {
                            console.error('ERROR: Failed to generate new JWT after successful payment.');
                        }
                        message = 'Giao dịch thành công & Gói cước đã được kích hoạt.';
                    }
                }
            }
        } catch (dbError) { // 👈 Bổ sung xử lý lỗi DB
            console.error("Lỗi xử lý Database trong VNPay Return:", dbError.message);
            message = 'Lỗi máy chủ khi xử lý dữ liệu giao dịch.';
        }
    } else { // 👈 Bổ sung xử lý lỗi Hash không khớp
        console.error("ERROR: Sai lệch Secure Hash. Giao dịch bị giả mạo hoặc dữ liệu bị thay đổi.");
        message = 'Lỗi bảo mật: Thông tin giao dịch không hợp lệ.';
    }
    
    const clientBaseUrl = clientReturnBaseUrl.replace(/\/payment$/, ''); 

    // 🔥 TRUYỀN TOKEN MỚI VÀO URL REDIRECT
    const finalRedirectUrl = `${clientBaseUrl}/payment?status=${paymentStatus}&amount=${amountReceived}&paymentId=${paymentId}&vnp_ResponseCode=${vnp_ResponseCode}&message=${encodeURIComponent(message)}&token=${newToken}`;
    
    const htmlRedirect = `
        <html>
        <head>
            <title>Chuyển hướng...</title>
            <meta http-equiv="refresh" content="0; url=${finalRedirectUrl}" />
        </head>
        <body>
            <p>Đang chuyển hướng đến trang kết quả thanh toán của bạn...</p>
        </body>
        </html>
    `;

    res.status(200).send(htmlRedirect); 
});

module.exports = router;