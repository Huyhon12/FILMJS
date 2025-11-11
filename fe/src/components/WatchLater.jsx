import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import Header from "./Header";
import "../css/WatchLater.css";
import { useCustomerAuth } from "../context/CustomerContext";
import { useMovieContext } from "../context/MovieContext";
import axios from "axios";

const WatchLater = () => {
  const navigate = useNavigate();
  const { customer, isLoggedIn } = useCustomerAuth();
  const { movies, loading: moviesLoading } = useMovieContext();

  const [watchlistIds, setWatchlistIds] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn && customer.id) {
      fetchWatchlist(customer.id);
    } else if (!isLoggedIn) {
      setLoadingWatchlist(false);
    }
  }, [isLoggedIn, customer.id]);

  const fetchWatchlist = async (customerId) => {
    setLoadingWatchlist(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/watchlists/${customerId}`
      );

      // Chỉ lấy ra danh sách các movieId
      const movieIds = response.data.data.map((item) => item.movieId);
      setWatchlistIds(movieIds);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách yêu thích.");
      setWatchlistIds([]);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  // Hàm Xóa thực tế
  const handleDelete = async (movieIdToDelete) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa phim này khỏi danh sách yêu thích?"
      )
    ) {
      return;
    }

    try {
      const customerId = customer.id;
      const response = await axios.delete(
        `http://localhost:5000/api/watchlists/${customerId}/${movieIdToDelete}`
      );

      alert(response.data.message);

      // Cập nhật lại danh sách ngay lập tức trên UI
      setWatchlistIds((prevIds) =>
        prevIds.filter((id) => id !== movieIdToDelete)
      );
    } catch (err) {
      console.error("Lỗi khi xóa Watchlist:", err);
      alert("Đã xảy ra lỗi khi xóa phim.");
    }
  };

  // Lọc danh sách phim từ MovieContext dựa trên Watchlist IDs
  const watchlistedMovies = movies.filter((movie) =>
    watchlistIds.includes(movie.movieId)
  );

  const isLoading = loadingWatchlist || moviesLoading;

  if (isLoading) {
    return (
      <div className="loading-state">Đang tải danh sách phim yêu thích...</div>
    );
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="main-app-container">
      <Header />
      <div className="content-area-wrapper">
        <div className="content-container">
          <h2 className="watch-later-title">
            Danh sách yêu thích của {customer?.name?.split(" ")[0] || "bạn"}
          </h2>

          {watchlistedMovies.length > 0 ? (
            <div className="movies-list">
              {watchlistedMovies.map((movie) => (
                <div key={movie.movieId} className="movie-card">
                  <Link to={`/movies/${movie.movieId}`}>
                    <img
                      src={movie.image}
                      alt={movie.name}
                      className="movie-card-image"
                    />
                  </Link>
                  <Link
                    to={`/movies/${movie.movieId}`}
                    className="movie-card-title-link"
                  >
                    <h3 className="movie-card-title">{movie.name}</h3>
                  </Link>

                  {/* SỬ DỤNG CLASS CŨ VÀ GỌI HÀM XÓA */}
                  <button
                    className="edit-button" // KHÔNG ĐỔI TÊN CLASS
                    onClick={() => handleDelete(movie.movieId)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-content">
              Bạn chưa có phim nào trong danh sách yêu thích.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchLater;
