import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/Admin.css";

const API_URL = "http://localhost:5000/api/movies";

// Dữ liệu form ban đầu
const initialFormData = {
  name: "",
  description: "",
  image: "",
  movieUrl: "",
  // Thêm các trường khác nếu bạn muốn quản lý (vd: rating, season)
  // rating: 0, 
  // season: 2024,
  // genres: [] 
};

export default function MovieAdmin() {
  const [movies, setMovies] = useState([]);
  
  // Dùng MỘT state (object) để quản lý tất cả dữ liệu form
  const [formData, setFormData] = useState(initialFormData);
  
  const [editingId, setEditingId] = useState(null); // Vẫn dùng movieId
  const [isLoading, setIsLoading] = useState(true);

  // Hàm tải danh sách phim
  const loadMovies = async () => {
    try {
      const res = await axios.get(API_URL);
      setMovies(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải movies:", err);
      alert("Lỗi khi tải danh sách phim!");
    } finally {
      setIsLoading(false);
    }
  };

  // Chạy 1 lần khi component tải
  useEffect(() => {
    loadMovies();
  }, []);

  // Hàm reset form và tắt chế độ editing
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  // Hàm xử lý chung khi thay đổi bất kỳ input nào
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Hàm Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async (e) => {
    e.preventDefault(); // Ngăn form reload
    if (!formData.name.trim() || !formData.description.trim() || !formData.image.trim() || !formData.movieUrl.trim()) {
      alert("Vui lòng điền đầy đủ các trường có dấu (*)");
      return;
    }

    try {
      if (!editingId) {
        // --- THÊM MỚI (POST) ---
        // Gửi tất cả data từ form + movieId mới
        const payload = {
          ...formData,
          movieId: Date.now().toString(),
        };
        await axios.post(API_URL, payload);
      } else {
        // --- CẬP NHẬT (PATCH) ---
        // Chỉ gửi dữ liệu form, vì movieId đã có ở URL
        await axios.patch(`${API_URL}/${editingId}`, formData);
      }

      resetForm(); // Xóa form
      await loadMovies(); // Tải lại danh sách

    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      // Hiển thị lỗi chi tiết từ server (nếu có)
      const errorMsg = err.response?.data?.details || err.message;
      alert(`Đã xảy ra lỗi khi lưu: ${errorMsg}`);
    }
  };

  // Hàm bắt đầu Sửa
  const startEdit = (movie) => {
    setEditingId(movie.movieId);
    // Lấy dữ liệu của movie đó điền vào form
    setFormData({
      name: movie.name || "",
      description: movie.description || "",
      image: movie.image || "",
      movieUrl: movie.movieUrl || "",
      // Thêm các trường khác nếu có
      // rating: movie.rating || 0,
      // season: movie.season || 2024,
    });
  };

  // Hàm Xóa
  const handleDelete = async (movieId) => {
    if (!window.confirm("Bạn có chắc muốn xóa movie này?")) return;
    try {
      await axios.delete(`${API_URL}/${movieId}`);
      await loadMovies();
      resetForm(); // Reset form nếu lỡ đang edit phim đó
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      alert("Lỗi khi xóa movie!");
    }
  };

  return (
    <>
      <h1 className="admin-page-title">
        {editingId ? "Cập nhật Loại Phim" : "Thêm Loại Phim"}
      </h1>

      {/* Sử dụng <form> và 'admin-card' */}
      <form className="admin-card admin-form" onSubmit={handleSave}>
        
        {/* Tổ chức form theo lưới (grid) */}
        <div className="admin-form-grid">
          {/* Tên Phim */}
          <div className="admin-form-group">
            <label htmlFor="name">Tên Phim (*)</label>
            <input
              id="name"
              name="name" // 'name' phải khớp với state
              className="admin-input"
              placeholder="Vd: Phim Lật Mặt 7"
              value={formData.name}
              onChange={handleFormChange}
            />
          </div>

          {/* Đường dẫn hình ảnh */}
          <div className="admin-form-group">
            <label htmlFor="image">Đường dẫn Hình ảnh (*)</label>
            <input
              id="image"
              name="image" // 'name' phải khớp với state
              className="admin-input"
              placeholder="Vd: /images/ten-phim.jpg"
              value={formData.image}
              onChange={handleFormChange}
            />
          </div>

          {/* Đường dẫn Video */}
          <div className="admin-form-group">
            <label htmlFor="movieUrl">Đường dẫn Video (*)</label>
            <input
              id="movieUrl"
              name="movieUrl" // 'name' phải khớp với state
              className="admin-input"
              placeholder="Vd: https://res.cloudinary.com/..."
              value={formData.movieUrl}
              onChange={handleFormChange}
            />
          </div>

          {/* Mô tả (full width) */}
          <div className="admin-form-group span-2">
            <label htmlFor="description">Mô tả (*)</label>
            <textarea
              id="description"
              name="description" // 'name' phải khớp với state
              className="admin-input"
              rows="3"
              placeholder="Nội dung tóm tắt của phim..."
              value={formData.description}
              onChange={handleFormChange}
            ></textarea>
          </div>
        </div>
        
        {/* Nút Bấm */}
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary">
            {editingId ? "Lưu Cập nhật" : "+ Thêm Movie"}
          </button>
          
          {/* Chỉ hiện nút Hủy khi đang Sửa */}
          {editingId && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={resetForm}
            >
              Hủy
            </button>
          )}
        </div>

      </form>

      {/* --- BẢNG DANH SÁCH PHIM --- */}
      <h1 className="admin-page-title" style={{ marginTop: '24px' }}>
        Danh sách Phim
      </h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên movie</th>
              <th>Mô tả</th>
              <th style={{ textAlign: "right", width: "120px" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: 16 }}>Đang tải...</td></tr>
            )}
            
            {!isLoading && movies.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 16 }}>
                  Chưa có movie nào
                </td>
              </tr>
            )}

            {!isLoading && movies.length > 0 &&
              movies.map((m) => (
                <tr key={m._id}>
                  <td>{m.name || "(Chưa có tên)"}</td>
                  {/* Cắt ngắn mô tả cho gọn */}
                  <td>{m.description?.substring(0, 50) || ""}...</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => startEdit(m)}
                      >
                        ✏
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(m.movieId)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}