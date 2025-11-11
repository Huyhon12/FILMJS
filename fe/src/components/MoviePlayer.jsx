import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "../css/MoviePlayer.css";
import { useMovieContext } from "../context/MovieContext";
import Header from "./Header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useCustomerAuth } from "../context/CustomerContext";

const renderRatingStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className="star full-star">
        ★
      </span>
    );
  }

  if (hasHalfStar) {
    stars.push(
      <span key="half" className="star half-star-wrapper">
        <span className="half-star">★</span>
      </span>
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className="star empty-star">
        ★
      </span>
    );
  }

  return <div className="rating-stars">{stars}</div>;
};

const MoviePlayer = () => {
  const { movieId } = useParams();
  const { movies, loading, error } = useMovieContext();
  const { customer, isLoggedIn } = useCustomerAuth();

  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const movie = movies.find((m) => m.movieId === Number(movieId));

  const effectRan = useRef(false);
  const customerId = customer?.id;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (effectRan.current === true) {
        return;
      }
    }

    const saveWatchHistory = async () => {
      if (isLoggedIn && customerId && movie) {
        try {
          await axios.post("http://localhost:5000/api/watchhistory", {
            customerId: customerId,
            movieId: movie.movieId,
          });
        } catch (err) {
          console.error("Lỗi khi lưu lịch sử xem:", err);
        }
      }
    };

    if (movieId && !loading && !error && movie) {
      saveWatchHistory();
    }

    return () => {
      effectRan.current = true;
    };
  }, [movieId, isLoggedIn, customerId, loading, error, movie]);

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (isLoggedIn && customerId && movie) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/watchlists/${customerId}`
          );

          const watchlist = response.data.data || [];

          const isMovieInWatchlist = watchlist.some(
            (item) => item.movieId === movie.movieId
          );

          setIsWatchlisted(isMovieInWatchlist);
        } catch (err) {
          console.error("Lỗi khi kiểm tra trạng thái watchlist:", err);
          setIsWatchlisted(false);
        }
      } else {
        setIsWatchlisted(false);
      }
    };

    if (isLoggedIn && customerId && movie) {
      checkWatchlistStatus();
    }
  }, [isLoggedIn, customerId, movie]);

  if (loading) {
    return <p>Đang tải thông tin phim...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!movie) {
    return <p>Phim không tìm thấy!</p>;
  }

  const displayRating = movie.rating ? parseFloat(movie.rating) : 0;

  const handleWatchLater = async () => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để thêm phim vào danh sách yêu thích!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/watchlists",
        {
          customerId,
          movieId: movie.movieId,
        }
      );

      if (response.data.action === "added") {
        alert(response.data.message);
        setIsWatchlisted(true);
      } else if (response.data.action === "removed") {
        alert(response.data.message);
        setIsWatchlisted(false);
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật watchlist:", err);
      alert("Đã xảy ra lỗi khi cập nhật danh sách yêu thích.");
    }
  };

  const watchLaterButtonClass = isWatchlisted
    ? "icon-button watchlisted"
    : "icon-button";

  return (
    <>
      <div className="main-header">
        <Header />
      </div>
      <div className="movie-player-container">
        <div className="main-video-player">
          <video controls className="movie-video">
            <source src={movie.movieUrl} type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>

        <div className="details-and-actions-section">
          <div className="movie-details-col full-width-col">
            <div className="movie-info-box">
              <h2>{movie.name}</h2>

              <button
                className={watchLaterButtonClass}
                onClick={handleWatchLater}
                title={
                  isWatchlisted
                    ? "Đã có trong danh sách yêu thích"
                    : "Thêm vào danh sách yêu thích"
                }
              >
                <FontAwesomeIcon icon={faHeart} size="lg" />
              </button>
            </div>

            <p className="movie-description">{movie.description}</p>
            <div className="rating">{renderRatingStars(displayRating)}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MoviePlayer;
