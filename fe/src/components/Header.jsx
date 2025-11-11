import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import SearchBar from "./SearchBar";
import "../css/Header.css";
import { useCustomerAuth } from "../context/CustomerContext";
import moment from "moment";

// --- Dữ liệu tĩnh ---
const GENRES = [
  { name: "Viễn Tưởng", path: "/genre/Viễn Tưởng" },
  { name: "Khoa Học", path: "/genre/Khoa Học" },
  { name: "Gia Đình", path: "/genre/Gia Đình" },
  { name: "Hài Hước", path: "/genre/Hài Hước" },
  { name: "Phiêu Lưu", path: "/genre/Phiêu Lưu" },
  { name: "Hoạt Hình", path: "/genre/Hoạt Hình" },
];

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 2014;
const SEASONS = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (v, i) => CURRENT_YEAR - i
);

// --- Hàm tính toán trạng thái gói cước (Đã fix lỗi tên thuộc tính) ---
const getSubscriptionStatus = (customer) => {
  // Ưu tiên lấy expiryDate (chữ thường) từ Context (từ API login), sau đó thử ExpiryDate (chữ hoa)
  const rawExpiryDate = customer?.expiryDate || customer?.ExpiryDate;

  // 1. Kiểm tra nếu không có dữ liệu khách hàng hoặc không có ngày hết hạn
  if (!customer || !rawExpiryDate) {
    return { isVip: false, remainingDays: 0, expiryDateFormatted: null };
  }

  const expiryDate = moment(rawExpiryDate);
  const currentDate = moment();

  // 2. Kiểm tra nếu ngày hết hạn vẫn còn sau thời điểm hiện tại
  if (expiryDate.isSameOrAfter(currentDate, "second")) {
    // Tính số ngày còn lại (làm tròn lên để tính cả ngày hiện tại)
    const remainingDays = expiryDate.diff(currentDate, "days") + 1;

    // Điều chỉnh ngày hết hạn hiển thị (logic múi giờ)
    let displayDate = expiryDate;
    if (
      displayDate.hour() >= 0 &&
      displayDate.hour() <= 7 &&
      displayDate.minute() < 5
    ) {
      displayDate = displayDate.subtract(1, "day");
    }

    return {
      isVip: true,
      remainingDays: remainingDays,
      expiryDateFormatted: displayDate.format("DD/MM/YYYY"),
    };
  }

  // 3. Đã hết hạn
  return { isVip: false, remainingDays: 0, expiryDateFormatted: null };
};

// --- Component Header ---
const Header = () => {
  const navigate = useNavigate();
  // SỬ DỤNG HOOK CUSTOMER CONTEXT
  const { customer, isLoggedIn, logout } = useCustomerAuth();

  // State để kiểm soát việc mở/đóng dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Lấy trạng thái VIP
  const { isVip, remainingDays } = getSubscriptionStatus(customer);

  // Hàm toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleWatchlist = () => {
    setIsDropdownOpen(false);
    navigate("/watchhistory");
  };

  const handleLogout = () => {
    setIsDropdownOpen(false); // Đóng dropdown khi click
    logout(); // Gọi hàm logout từ context
    navigate("/");
  };

  const handleWatchLater = () => {
    navigate("/watchlater");
  };

  const handleVip = () => {
    navigate("/payment");
  };

  // Lấy tên để hiển thị (chỉ lấy phần đầu tiên của tên nếu là full name)
  const displayName = customer?.name?.split(" ")[0] || "Khách hàng";

  return (
    <header className="header">
      <div className="logo-section">
        <svg
          className="logo-icon"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <div className="logo-text-container">
          <Link to="/" className="logo-main-text">
            NETFLEX
          </Link>
        </div>
      </div>

      <nav className="nav">
        <ul>
          <li>
            <Link to="/" className="nav-link">
              TRANG CHỦ
            </Link>
          </li>
          {/* Menu THỂ LOẠI */}
          <li className="dropdown">
            <span className="nav-link">
              THỂ LOẠI <span className="dropdown-arrow">&#9660;</span>
            </span>
            <div className="dropdown-content">
              {GENRES.map((genre) => (
                <Link key={genre.path} to={genre.path}>
                  {genre.name}
                </Link>
              ))}
            </div>
          </li>
          {/* Menu SEASON */}
          <li className="dropdown">
            <span className="nav-link">
              SEASON<span className="dropdown-arrow">&#9660;</span>
            </span>
            <div className="dropdown-content">
              {SEASONS.map((season) => (
                <Link key={season} to={`/season/${season}`}>
                  {season}
                </Link>
              ))}
            </div>
          </li>
        </ul>
      </nav>

      <div className="header-icons">
        {/* LOGIC HIỂN THỊ NÚT VIP/THỜI GIAN CÒN LẠI */}
        {isVip && isLoggedIn ? (
          // Ẩn UP VIP và hiển thị thời gian còn lại
          <button
            className="vip-status-button active"
            title="Gói cước VIP đang hoạt động"
          >
            VIP: {remainingDays} NGÀY
          </button>
        ) : (
          // Hiển thị nút UP VIP (cho khách chưa đăng nhập hoặc đã hết hạn)
          <button className="vip-button" onClick={handleVip}>
            UP VIP
          </button>
        )}

        <button
          className="icon-button"
          onClick={handleWatchLater}
          title="Phim Yêu Thích"
          aria-label="Phim Yêu Thích"
        >
          <FontAwesomeIcon icon={faHeart} size="lg" />
        </button>

        <SearchBar />

        {/* LOGIC HIỂN THỊ CHÀO MỪNG VÀ DROPDOWN */}
        {isLoggedIn ? (
          <div className="profile-wrapper" onClick={toggleDropdown}>
            <span className="welcome-text">Xin chào, {displayName}</span>
            <button
              className={`dropdown-toggle-icon ${isDropdownOpen ? "open" : ""}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div className="profile-dropdown-menu">
                <button onClick={handleWatchlist} className="dropdown-item">
                  Lịch sử
                </button>
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout-btn"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          // HIỂN THỊ NÚT ĐĂNG NHẬP KHI CHƯA ĐĂNG NHẬP
          <button className="login-button" onClick={handleLoginClick}>
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
