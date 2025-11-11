import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "./Header";
import "../css/WatchHistory.css";
import { useCustomerAuth } from "../context/CustomerContext";
import { useMovieContext } from "../context/MovieContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faTimes } from "@fortawesome/free-solid-svg-icons";

const WatchHistory = () => {
  const { customer, isLoggedIn } = useCustomerAuth();
  const { movies, loading: moviesLoading } = useMovieContext();

  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const customerId = customer?.id;

  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!isLoggedIn || !customerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/watchhistory/${customerId}`
        );
        setHistoryList(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải lịch sử xem:", err);
        setError("Không thể tải lịch sử xem. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    fetchWatchHistory();
  }, [isLoggedIn, customerId]);

  const displayHistory = useMemo(() => {
    if (moviesLoading || !historyList.length) return [];

    const uniqueHistoryMap = new Map();

    historyList.forEach((item) => {
      if (!uniqueHistoryMap.has(item.movieId)) {
        uniqueHistoryMap.set(item.movieId, item);
      }
    });

    const uniqueList = Array.from(uniqueHistoryMap.values());

    return uniqueList
      .map((historyItem) => {
        const movieDetails = movies.find(
          (m) => m.movieId === historyItem.movieId
        );

        if (!movieDetails) return null;

        const watchedDate = new Date(historyItem.createdAt);
        const timeDiff = Date.now() - watchedDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const lastWatchedText =
          daysDiff === 0
            ? "Hôm nay"
            : daysDiff === 1
            ? "Hôm qua"
            : `${daysDiff} ngày trước`;

        return {
          ...historyItem,
          name: movieDetails.name,
          image: movieDetails.image,
          lastWatched: lastWatchedText,
        };
      })
      .filter((item) => item !== null);
  }, [historyList, movies, moviesLoading]);

  const handleClearHistory = async () => {
    if (!customerId || displayHistory.length === 0) return;

    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không? Hành động này không thể hoàn tác."
      )
    ) {
      try {
        await axios.delete(
          `http://localhost:5000/api/watchhistory/${customerId}`
        );
        alert("Đã xóa toàn bộ lịch sử xem thành công.");
        setHistoryList([]);
      } catch (err) {
        console.error("Lỗi khi xóa toàn bộ lịch sử:", err);
        alert("Đã xảy ra lỗi khi xóa lịch sử xem.");
      }
    }
  };

  const handleDeleteItem = async (movieIdToDelete) => {
    if (!customerId) return;

    if (
      !window.confirm("Bạn có chắc chắn muốn xóa mục này khỏi lịch sử không?")
    )
      return;

    try {
      await axios.delete(
        `http://localhost:5000/api/watchhistory/${customerId}/${movieIdToDelete}`
      );

      setHistoryList((prev) =>
        prev.filter((item) => item.movieId !== movieIdToDelete)
      );

      alert("Đã xóa phim khỏi lịch sử xem thành công.");
    } catch (error) {
      console.error("Lỗi khi xóa mục:", error);
      alert("Lỗi: Không thể xóa mục này khỏi lịch sử xem.");
    }
  };

  const username = customer?.name?.toUpperCase() || "KHÁCH HÀNG";
  const totalWatched = displayHistory.length;

  if (loading || moviesLoading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  if (!isLoggedIn) {
    return <p>Vui lòng đăng nhập để xem lịch sử.</p>;
  }

  return (
    <div className="main-app-container">
      <Header />
      <div className="content-area-wrapper">
        <div className="history-content-container">
          <h1 className="history-main-title">
            LỊCH SỬ XEM CỦA {username} - BẠN ĐÃ XEM {totalWatched} PHIM GẦN ĐÂY
          </h1>

          <div className="history-note-box">
            <p className="note-text">
              <span className="note-label">LƯU Ý:</span> Lịch sử xem lưu trên
              tài khoản của bạn
            </p>
            <button
              className="clear-history-button"
              onClick={handleClearHistory}
              disabled={totalWatched === 0}
            >
              <FontAwesomeIcon icon={faTrashAlt} /> Xóa toàn bộ lịch sử
            </button>
          </div>

          {error && <div className="error-state">{error}</div>}

          {totalWatched === 0 ? (
            <div className="no-content">Bạn chưa xem phim nào gần đây.</div>
          ) : (
            <div className="history-list">
              {displayHistory.map((item) => (
                <div key={item._id} className="history-card">
                  <div className="image-wrapper">
                    <button
                      className="delete-item-button"
                      onClick={() => handleDeleteItem(item.movieId)}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>

                    <Link to={`/movies/${item.movieId}`}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="history-card-image"
                      />
                    </Link>
                  </div>

                  <div className="history-info">
                    <Link
                      to={`/movies/${item.movieId}`}
                      className="history-title-link"
                    >
                      <h3>{item.name}</h3>
                    </Link>
                    <p className="last-watched-time">Lúc {item.lastWatched}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchHistory;
// D:\Web\FilmJs\fe\src\components\WatchHistory.jsx
