// src/context/CustomerContext.js

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { jwtDecode } from "jwt-decode";
import moment from "moment"; // ✅ Cần thiết để tính toán ngày hết hạn

const CustomerContext = createContext();

// Hàm xử lý việc giải mã token (giữ nguyên logic của bạn)
const decodeToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // Token hết hạn
    }
    return decoded;
  } catch (e) {
    return null; // Token không hợp lệ
  }
};

// ✅ HÀM TÍNH TOÁN CẦN CHUYỂN VỀ ĐÂY
const getSubscriptionStatus = (customer) => {
  // Ưu tiên lấy expiryDate (chữ thường) từ Context, sau đó thử ExpiryDate (chữ hoa)
  const rawExpiryDate = customer?.expiryDate || customer?.ExpiryDate;

  if (!customer || !rawExpiryDate) {
    return { isVip: false, remainingDays: 0, expiryDateFormatted: null };
  }

  const expiryDate = moment(rawExpiryDate);
  const currentDate = moment();

  // 1. Kiểm tra nếu ngày hết hạn vẫn còn sau thời điểm hiện tại
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

  // 2. Đã hết hạn
  return { isVip: false, remainingDays: 0, expiryDateFormatted: null };
};

export const CustomerProvider = ({ children }) => {
  const storedData = localStorage.getItem("customerData");
  const initialData = storedData ? JSON.parse(storedData) : {};

  const [token, setToken] = useState(initialData.token || null);
  const [customer, setCustomer] = useState(initialData.user || null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!initialData.token && !!initialData.user
  );

  const updateCustomerState = useCallback((newToken, fullUserObject) => {
    if (newToken && fullUserObject) {
      const finalCustomerData = {
        token: newToken,
        user: fullUserObject, // Phải có vipExpiryDate/expiryDate/ExpiryDate
      };
      localStorage.setItem("customerData", JSON.stringify(finalCustomerData));
      setToken(newToken);
      setCustomer(fullUserObject);
      setIsLoggedIn(true);
      return true;
    } else {
      localStorage.removeItem("customerData");
      setToken(null);
      setCustomer(null);
      setIsLoggedIn(false);
      return false;
    }
  }, []);

  const login = useCallback(
    (fullUserObject, newToken) => {
      updateCustomerState(newToken, fullUserObject);
    },
    [updateCustomerState]
  );

  const logout = () => {
    localStorage.removeItem("customerData");
    setToken(null);
    setCustomer(null);
    setIsLoggedIn(false);
  };

  // ✅ LOGIC CỐT LÕI: Tính toán VIP ngay trong Context bằng useMemo
  const subscriptionStatus = useMemo(() => {
    return getSubscriptionStatus(customer);
  }, [customer]); // Tính lại mỗi khi đối tượng customer thay đổi

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn,
        isVip: subscriptionStatus.isVip, // ✅ Lấy giá trị tính toán ngay lập tức
        remainingDays: subscriptionStatus.remainingDays,
        expiryDateFormatted: subscriptionStatus.expiryDateFormatted,
        logout,
        updateCustomerFromToken: useCallback(
          (newToken) => {
            const decoded = decodeToken(newToken);
            if (decoded) {
              updateCustomerState(newToken, decoded);
            } else {
              updateCustomerState(null, null);
            }
          },
          [updateCustomerState]
        ),
        login,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerAuth = () => {
  return useContext(CustomerContext);
};
