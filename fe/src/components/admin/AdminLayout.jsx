import React, { useState } from "react"; // <-- THÊM { useState }
import { NavLink, Outlet } from "react-router-dom";
import "../../css/Admin.css";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // <-- THÊM STATE

  const menus = [
    { to: "/admin/movies", label: "Loại Phim", icon: "🎬" },
    { to: "/admin/revenue", label: "Doanh Thu", icon: "📊" },
    { to: "/admin/users", label: "Người Dùng", icon: "👥" },
    { to: "/admin/settings", label: "Cài Đặt", icon: "⚙️" },
  ];

  return (
    // THÊM CLASS ĐỘNG Ở ĐÂY
    <div
      className={`admin-layout ${
        isSidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <aside className="admin-sidebar">
        <div className="admin-logo">ADMIN</div>
        <div className="admin-nav-title">Bảng điều khiển</div>
        {menus.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            className={({ isActive }) =>
              "admin-nav-item" + (isActive ? " active" : "")
            }
          >
            <span className="icon">{m.icon}</span>
            {/* THÊM <span> để dễ ẩn/hiện */}
            <span className="label">{m.label}</span>
          </NavLink>
        ))}

        <div className="admin-logout">
          ⏻ <span className="label">Đăng xuất</span>
        </div>
      </aside>

      <div className="admin-content-wrap">
        {/* === THÊM NÚT TOGGLE === */}
        <button
          className="admin-sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "❮" : "❯"}
        </button>
        {/* ======================= */}

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}