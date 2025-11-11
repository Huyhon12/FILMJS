import React, { useState } from "react";
import { FaFacebookF, FaGoogle } from "react-icons/fa";
import "../css/RegisterScreen.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleContinue = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/customers/register",
        {
          Name: name,
          Email: email,
          Phone: phone,
          Address: address,
          Password: password,
        }
      );
      setMessage(response.data.message);
      if (response.status === 201) {
        setTimeout(() => {
          navigate("/login");
        }, 3500);
      }
    } catch (error) {
      setMessage(
        error.response
          ? error.response.data.message
          : "Đã xảy ra lỗi. Vui lòng thử lại."
      );
    }
  };

  const handleSocialLogin = (platform) => {
    console.log(`Đăng nhập bằng ${platform}`);
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const isButtonDisabled =
    !name ||
    !password ||
    password !== confirmPassword ||
    !email ||
    !phone ||
    !address;

  return (
    <div className="register-container">
      <div className="background-overlay" />

      <div className="register-card">
        <button className="close-button">×</button>
        <div className="register-header">
          <h2>Đăng ký</h2>
        </div>
        {message && <div className="message">{message}</div>}
        <form onSubmit={handleContinue} className="register-form">
          <input
            type="text"
            placeholder="Tên tài khoản"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Địa chỉ"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
          />

          <button
            type="submit"
            className="continue-button"
            disabled={isButtonDisabled}
          >
            Đăng ký
          </button>

          <div className="login-link-container">
            <span>Đã có tài khoản? </span>
            <button
              type="button"
              className="login-link-button"
              onClick={handleLoginClick}
            >
              Đăng nhập
            </button>
          </div>

          <div className="divider">Hoặc</div>
        </form>

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
      </div>
    </div>
  );
};

export default RegisterScreen;
