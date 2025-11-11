import React, { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import Header from "./Header";
import { useMovieContext } from "../context/MovieContext";
import "../css/SeasonPage.css";

const normalizeString = (str) => {
  if (!str) return "";
  return (
    str
      .toLowerCase()
      // Loại bỏ dấu tiếng Việt (tham khảo)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Xóa ký tự đ
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .trim()
  );
};

// Hook tiện ích để lấy giá trị query parameter
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SearchPage = () => {
  const query = useQuery();
  // Lấy từ khóa tìm kiếm (q) từ query string: /search?q=từ_khóa
  const searchTerm = query.get("q") || "";
  const { movies } = useMovieContext();

  // Chuẩn hóa từ khóa tìm kiếm
  const normalizedSearchTerm = normalizeString(searchTerm);

  // Lọc phim (sử dụng useMemo để tối ưu hóa hiệu suất)
  const filteredMovies = useMemo(() => {
    if (!normalizedSearchTerm) {
      return [];
    }

    return movies.filter((movie) => {
      // Chuẩn hóa tên phim trước khi so sánh
      const movieName = normalizeString(movie.name);

      // So sánh: tìm kiếm không dấu và không phân biệt chữ hoa/thường
      return movieName.includes(normalizedSearchTerm);
    });
  }, [movies, normalizedSearchTerm]);

  return (
    <div className="main-layout">
      <Header />
      <div className="season-page-content">
        {/* Vẫn hiển thị từ khóa gốc (có dấu) cho người dùng thấy */}
        <h2 className="page-title">Kết quả tìm kiếm cho: {searchTerm}</h2>

        {filteredMovies.length > 0 ? (
          <div className="movie-list-container">
            {filteredMovies.map((movie) => (
              <Link
                key={movie.movieId}
                to={`/movies/${movie.movieId}`}
                className="movie-cardd-link"
              >
                <div className="movie-cardd">
                  <div className="movie-poster-wrapper">
                    <img
                      src={movie.image}
                      alt={movie.name}
                      className="movie-poster"
                      loading="lazy"
                    />
                  </div>
                  <div className="movie-info">
                    <h3 className="movie-title">{movie.name}</h3>
                    {movie.description && (
                      <p className="movie-description">{movie.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="no-results">
            Rất tiếc, không tìm thấy kết quả nào cho từ khóa **{searchTerm}**.
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
