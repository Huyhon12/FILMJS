import React, { useState } from "react";
import "../css/PaymentModal.css";
import axios from "axios";

// Cấu hình URL cơ sở cho API của bạn
const API_BASE_URL = "http://localhost:5000/api";

// Hàm hiển thị thông báo (sử dụng window.alert)
const showMessage = (message) => {
  console.warn(`[User Alert] ${message}`);
  window.alert(message);
};

const PaymentSelectionModal = ({
  pkg,
  formatPrice,
  formatDuration,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false); // ⭐️ Hàm xử lý khi chọn phương thức thanh toán (Đã hỗ trợ MoMo)

  const handlePaymentSelect = async (method) => {
    // Không cần kiểm tra if (method !== "vnpay") nữa vì giờ chúng ta hỗ trợ cả hai

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Vui lòng đăng nhập để thực hiện thanh toán.");
        setIsLoading(false);
        return;
      } // --- BƯỚC 1: TẠO BẢN GHI PAYMENT MỚI (status: pending) ---

      const initialPaymentData = {
        amount: pkg.priceAmount,
        priceId: pkg.priceId,
        paymentMethod: method,
      };

      console.log(
        `Bước 1: Tạo bản ghi Payment (${method}) với:`,
        initialPaymentData
      ); // 💡 Gọi API tạo Payment

      const createPaymentResponse = await axios.post(
        `${API_BASE_URL}/payment/create`,
        initialPaymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newPaymentId = createPaymentResponse.data.paymentId;
      if (!newPaymentId) {
        throw new Error(
          "Không nhận được paymentId từ server sau khi tạo bản ghi."
        );
      }

      console.log(`Bước 1 Thành công. New Payment ID: ${newPaymentId}`); // --- BƯỚC 2: TẠO URL THANH TOÁN (Tùy thuộc vào phương thức) ---

      let paymentUrl = null;
      let paymentGatewayResponse;

      const gatewayPayload = {
        orderId: newPaymentId, // Dùng cho VNPay
        amount: pkg.priceAmount,
      };

      if (method === "vnpay") {
        // VNPay: Gọi API VNPay Backend
        paymentGatewayResponse = await axios.post(
          `${API_BASE_URL}/vnpay/create_payment_url`,
          gatewayPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        throw new Error(`Phương thức thanh toán '${method}' không hợp lệ.`);
      } // --- BƯỚC 3: Xử lý Phản hồi và Chuyển hướng ---

      if (paymentGatewayResponse.data && paymentGatewayResponse.data.url) {
        paymentUrl = paymentGatewayResponse.data.url;

        console.log(
          `Bước 2 Thành công. ${method.toUpperCase()} Payment URL received:`,
          paymentUrl
        );
        onClose(); // Đóng modal trước khi chuyển hướng // Chuyển hướng người dùng đến URL thanh toán

        window.location.href = paymentUrl;
      } else {
        showMessage(
          `Lỗi: Không nhận được URL thanh toán từ ${method.toUpperCase()}.`
        );
      }
    } catch (error) {
      console.error(
        "Error during payment process:",
        error.response ? error.response.data : error.message
      ); // Xử lý lỗi từ server và thông báo chi tiết (logic này đã tốt)

      const responseData = error.response && error.response.data;
      let errorMessage = "Lỗi hệ thống. Vui lòng thử lại.";

      if (responseData) {
        if (responseData.isSubscriptionActive && responseData.details) {
          errorMessage = `${responseData.error}\n${responseData.details}`;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      }

      showMessage(`Lỗi thanh toán: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pkg) return null; // Inline SVG cho nút đóng (Giữ nguyên)

  const CloseIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="feather feather-x"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="payment-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} disabled={isLoading}>
          <CloseIcon />
        </button>
        <h2 className="modal-title">Xác nhận Gói Dịch Vụ</h2>
        {/* 1. Thông tin gói */}
        <div className="package-info-display">
          <img src={pkg.image} alt={pkg.name} className="modal-package-image" />
          <div className="details">
            <h3 className="package-name">{pkg.name.toUpperCase()}</h3>
            <p className="price-text">
              Giá:
              <span className="price-amount-modal">
                {formatPrice(pkg.priceAmount)}
              </span>
              <span className="duration-modal">
                / {formatDuration(pkg.duration, pkg.unit)}
              </span>
            </p>
          </div>
        </div>
        <h3 className="select-method-title">Chọn Phương Thức Thanh Toán</h3>
        {/* Loading Indicator */}
        {isLoading && (
          <div className="loading-overlay">
            Đang xử lý giao dịch... Vui lòng chờ.
          </div>
        )}
        {/* 2. Lựa chọn Thanh toán */}
        <div className="payment-methods">
          {/* Thanh toán bằng VNPay */}
          <button
            className="payment-method-button vnpay"
            onClick={() => handlePaymentSelect("vnpay")}
            disabled={isLoading}
          >
            <img src="/images/vnpay.jpg" alt="VNPay" className="method-logo" />
            <span className="method-name">VNPay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelectionModal;
