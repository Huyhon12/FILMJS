import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/Admin.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = "http://localhost:5000/api/payment/revenue";

const months = [
  { value: "", label: "Cả năm" },
  { value: 1, label: "Tháng 1" },
  { value: 2, label: "Tháng 2" },
  { value: 3, label: "Tháng 3" },
  { value: 4, label: "Tháng 4" },
  { value: 5, label: "Tháng 5" },
  { value: 6, label: "Tháng 6" },
  { value: 7, label: "Tháng 7" },
  { value: 8, label: "Tháng 8" },
  { value: 9, label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

const years = [2023, 2024, 2025, 2026];

const formatVND = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v || 0);

export default function RevenueAdmin() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(""); // "" = xem cả năm
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    totalRevenue: 0,
    orderCount: 0,
    stats: [],
  });

  const fetchRevenue = async (y = year, m = month) => {
    setLoading(true);
    try {
      const params = { year: y };
      if (m !== "" && m !== null) params.month = m; // có tháng mới gửi
      const res = await axios.get(API_URL, { params });
      setData(res.data || {});
    } catch (e) {
      console.error(e);
      alert("Lỗi tải dữ liệu doanh thu");
      setData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
    // eslint-disable-next-line
  }, []);

  const isYearView = month === "" || month === null;

  // Hỗ trợ cả API trả stats hoặc daily (phòng lệch code)
  const rawStats = data.stats || data.daily || [];
  const safeStats = Array.isArray(rawStats) ? rawStats : [];

  // Nhãn trục X:
  const labels = isYearView
    ? safeStats.map((s) => `Tháng ${s.month}`)
    : safeStats.map((s) => `Ngày ${s.day}`);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: safeStats.map((s) => s.total),
        backgroundColor: "rgba(212,166,74,0.6)",
        borderColor: "rgba(212,166,74,1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: isYearView
          ? `Biểu đồ doanh thu năm ${year}`
          : `Biểu đồ doanh thu tháng ${month} / ${year}`,
      },
    },
  };

  const totalRevenue = data.totalRevenue || 0;
  const orderCount = data.orderCount || 0;

  return (
    <>
      <h1 className="admin-page-title">
        {isYearView
          ? `Doanh thu theo tháng (năm ${year})`
          : `Doanh thu theo ngày (tháng ${month}/${year})`}
      </h1>

      {/* Bộ lọc */}
      <div className="admin-toolbar">
        <select
          className="admin-input"
          style={{ maxWidth: 160 }}
          value={month}
          onChange={(e) =>
            setMonth(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          {months.map((m) => (
            <option key={m.label} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          className="admin-input"
          style={{ maxWidth: 120 }}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          className="admin-btn-primary"
          onClick={() => fetchRevenue(year, month)}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Xem doanh thu"}
        </button>
      </div>

      {/* Thẻ tổng quan */}
      <div
        className="admin-card admin-form-grid"
        style={{ padding: "20px 24px", marginBottom: 20 }}
      >
        <div className="admin-form-group">
          <label>Tổng doanh thu</label>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#d48806" }}>
            {formatVND(totalRevenue)}
          </div>
        </div>
        <div className="admin-form-group">
          <label>Số giao dịch</label>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{orderCount}</div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="admin-card" style={{ padding: "16px 20px" }}>
        {loading ? (
          <p>Đang tải biểu đồ...</p>
        ) : safeStats.length ? (
          <Bar options={chartOptions} data={chartData} />
        ) : (
          <p style={{ textAlign: "center" }}>Không có dữ liệu</p>
        )}
      </div>

      {/* Bảng chi tiết */}
      <h3 className="admin-page-title" style={{ marginTop: 20 }}>
        Dữ liệu chi tiết
      </h3>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{isYearView ? "Tháng" : "Ngày"}</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {safeStats.length ? (
              safeStats.map((s) => (
                <tr key={isYearView ? s.month : s.day}>
                  <td>
                    {isYearView
                      ? `Tháng ${s.month}`
                      : `Ngày ${s.day}`}
                  </td>
                  <td>{formatVND(s.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: "center", padding: 14 }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}