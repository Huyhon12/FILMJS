// File: src/components/VipRoute.js (Cần đảm bảo file này tồn tại và nội dung đúng)

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerContext";

const VipRoute = () => {
  const { isLoggedIn, isVip } = useCustomerAuth();

  if (!isLoggedIn || !isVip) {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    } else {
      return <Navigate to="/payment" replace />;
    }
  }

  // Cho phép truy cập
  return <Outlet />;
};

export default VipRoute;
