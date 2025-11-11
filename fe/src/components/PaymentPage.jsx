// src/pages/PaymentPage.js

import React, { useState, useEffect, useMemo } from "react";
import "../css/PaymentPage.css";
import Header from "./Header";
import { FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import PaymentSelectionModal from "./PaymentSelectionModal";
import { useLocation, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerContext";

const PaymentPage = () => {
  const [vipPackage, setVipPackage] = useState(null);
  const [svipPackage, setSvipPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // ✅ KHAI BÁO HOOKS CẦN THIẾT
  const location = useLocation();
  const navigate = useNavigate();
  const { updateCustomerFromToken } = useCustomerAuth();

  // Đọc URL parameters
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // 1. Logic tải gói dịch vụ
  useEffect(() => {
    const fetchPackageDetails = async (priceId, setPackageState) => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/prices/${priceId}`
        );
        setPackageState(response.data);
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          err.response &&
          err.response.status === 404
        ) {
          console.warn(`Gói priceId=${priceId} không tồn tại trong DB.`);
        } else {
          console.error(`Lỗi khi tải gói ${priceId}:`, err);
          setError("Không thể kết nối đến server hoặc có lỗi xảy ra.");
        }
      }
    };

    const loadAllPackages = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchPackageDetails(1, setVipPackage),
        fetchPackageDetails(2, setSvipPackage),
      ]);
      setLoading(false);
    };

    loadAllPackages();
  }, []);

  // 2. 🔥 LOGIC XỬ LÝ KẾT QUẢ THANH TOÁN (FIXED LỖI TOKEN VÀ DEPENDENCY)
  useEffect(() => {
    const tokenFromUrl = queryParams.get("token");
    const paymentStatus = queryParams.get("status");
    const paymentMessage = queryParams.get("message");

    if (paymentStatus) {
      // ✅ Cập nhật Token nếu có
      if (tokenFromUrl) {
        updateCustomerFromToken(tokenFromUrl);
        console.log("VIP status updated via new token from URL.");
      }

      // Hiển thị thông báo kết quả
      if (paymentMessage) {
        const decodedMessage = decodeURIComponent(paymentMessage);
        window.alert(
          `Kết quả thanh toán:\n[${paymentStatus.toUpperCase()}] ${decodedMessage}`
        );
      }

      // Dọn dẹp URL bằng cách navigate thay thế history
      const cleanUrl = location.pathname; // <-- Sử dụng location.pathname
      navigate(cleanUrl, { replace: true });
    }

    // ✅ Đã thêm location.pathname vào dependency array
  }, [
    location.search,
    navigate,
    queryParams,
    updateCustomerFromToken,
    location.pathname,
  ]);

  const formatPrice = (amount) => {
    if (!amount) return "N/A";
    return amount.toLocaleString("vi-VN") + " VNĐ";
  };

  const formatDuration = (duration, unit) => {
    if (!duration || !unit) return "Thời hạn linh hoạt";
    let unitText = "";
    if (unit === "day") unitText = "ngày";
    else if (unit === "month") unitText = "tháng";
    else if (unit === "year") unitText = "năm";
    return `${duration} ${unitText}`;
  };

  const handlePurchaseClick = (pkg) => {
    setSelectedPackage(pkg);
  };

  if (loading) {
    return <p className="loading-state">Đang tải thông tin gói dịch vụ...</p>;
  }

  if (error) {
    return <p className="error-state">{error}</p>;
  }

  if (!vipPackage && !svipPackage) {
    return (
      <p className="error-state">
        Không tìm thấy gói dịch vụ nào. Vui lòng kiểm tra dữ liệu trong
        Database.
      </p>
    );
  }

  const vip = vipPackage;
  const svip = svipPackage;

  return (
    <div className="payment-page">
      <Header />
      <div className="payment-container">
        {/* -------------------- GÓI VIP (priceId = 1) -------------------- */}
        {vip && (
          <div className="package">
            <div className="package-card">
              <h2>{vip.name.toUpperCase()}</h2>
              <img
                src={vip.image}
                alt={`${vip.name} Package`}
                className="package-image"
              />
              <div className="price-display">
                <span className="price-amount">
                  {formatPrice(vip.priceAmount)}
                </span>
                <span className="price-duration">
                  / {formatDuration(vip.duration, vip.unit)}
                </span>
              </div>

              <ul className="features-list">
                <li>
                  <FaCheckCircle className="icon" /> Phim hoạt hình Vietsub
                </li>
                <li>
                  <FaCheckCircle className="icon" /> Không quảng cáo
                </li>
                <li>
                  <FaCheckCircle className="icon" /> Full HD/4K
                </li>
              </ul>

              <button
                className="purchase-button"
                onClick={() => handlePurchaseClick(vip)}
              >
                Mua {vip.name}
              </button>
            </div>
          </div>
        )}

        {/* -------------------- GÓI SVIP (priceId = 2) -------------------- */}
        {svip && (
          <div className="package">
            <div className="package-card">
              <h2>{svip.name.toUpperCase()}</h2>
              <img
                src={svip.image}
                alt={`${svip.name} Package`}
                className="package-image"
              />
              <div className="price-display">
                <span className="price-amount">
                  {formatPrice(svip.priceAmount)}
                </span>
                <span className="price-duration">
                  / {formatDuration(svip.duration, svip.unit)}
                </span>
              </div>

              <ul className="features-list">
                <li>
                  <FaCheckCircle className="icon" /> Phim hoạt hình Vietsub
                </li>
                <li>
                  <FaCheckCircle className="icon" /> Không quảng cáo
                </li>
                <li>
                  <FaCheckCircle className="icon" /> Full HD/4K
                </li>
              </ul>

              <button
                className="purchase-button"
                onClick={() => handlePurchaseClick(svip)}
              >
                Mua {svip.name}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL THANH TOÁN */}
      {selectedPackage && (
        <PaymentSelectionModal
          pkg={selectedPackage}
          formatPrice={formatPrice}
          formatDuration={formatDuration}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </div>
  );
};

export default PaymentPage;
