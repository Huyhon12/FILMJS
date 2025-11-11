// src/components/LoginScreen.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaGoogle } from "react-icons/fa";
import "../css/LoginScreen.css";
import axios from "axios";
import { useCustomerAuth } from "../context/CustomerContext";

const LoginScreen = () => {
  const [Name, setName] = useState("");
  const [Password, setPassword] = useState("");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const { login } = useCustomerAuth();

  const handleContinue = async (e) => {
    e.preventDefault();

    try {
      console.log(`Đăng nhập bằng Tài khoản: ${Name}, Mật khẩu: ${Password}`);
      const response = await axios.post(
        "http://localhost:5000/api/customers/login",
        { Name, Password }
      ); // ✅ Lấy đầy đủ user object, token và message từ phản hồi

      const { user, token, message: successMessage } = response.data;

      if (response.status === 200) {
        // 🔥 GỌI LOGIN VỚI USER VÀ TOKEN
        login(user, token);

        setMessage(successMessage);
        navigate("/");
      }
    } catch (error) {
      setMessage(
        error.response
          ? error.response.data.message
          : "Đã xảy ra lỗi. Vui lòng thử lại. (Lỗi mạng hoặc server)"
      );
    }
  };

  const handleSocialLogin = (platform) => {
    console.log(`Đăng nhập bằng ${platform}`);
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const isButtonDisabled = !Name || !Password;

  return (
    <div className="login-container">
      <div className="background-overlay" />
      <div className="login-card">
        <button className="close-button">×</button>
        <div className="login-header">
          <h2>Đăng nhập</h2>
        </div>
        {message && <div className="message">{message}</div>}
        <form onSubmit={handleContinue} className="login-form">
          <input
            type="text"
            placeholder="Tên tài khoản"
            value={Name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={Password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <div className="forgot-password">
            <a href="/changepassword">Quên mật khẩu?</a>
          </div>
          <button
            type="submit"
            className="continue-button"
            disabled={isButtonDisabled}
          >
            Đăng nhập
          </button>
          <div className="register-link-container">
            <span>Chưa có tài khoản? </span>
            <button
              type="button"
              className="register-link-button"
              onClick={handleRegisterClick}
            >
              Đăng ký
            </button>
          </div>
          <div className="divider">Hoặc</div>
          <div className="social-login-row">
            <button
              type="button"
              className="social-button facebook-button"
              onClick={() => handleSocialLogin("Facebook")}
            >
              <FaFacebookF className="social-icon" />
              Facebook
            </button>
            <button
              type="button"
              className="social-button google-button"
              onClick={() => handleSocialLogin("Google")}
            >
              <FaGoogle className="social-icon google" />
              Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
