import React, { useState } from "react";
import "../css/ChangePassword.css";

const ChangePassword = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();
    console.log(
      `Thay đổi mật khẩu cho Tài khoản: ${username}, Email: ${email}, Mã xác minh: ${verificationCode}, Mật khẩu mới: ${newPassword}`
    );
    // Thêm logic gửi yêu cầu API tại đây
  };

  const isButtonDisabled =
    !username ||
    !email ||
    !verificationCode ||
    !newPassword ||
    newPassword !== confirmPassword;

  return (
    <div className="change-password-container">
      <div className="background-overlay" />

      <div className="change-password-card">
        <button className="close-button">×</button>

        <div className="change-password-header">
          <h2>Thay đổi mật khẩu</h2>
        </div>

        <form onSubmit={handleChangePassword} className="change-password-form">
          <input
            type="text"
            placeholder="Tên tài khoản"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            placeholder="Mã xác minh"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            Thay đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
