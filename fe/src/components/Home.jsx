import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import UpNextSection from "./UpNextSection";
import "../css/Home.css";
import "../css/FeaturedMovieCarousel.css";
import { useMovieContext } from "../context/MovieContext";

const AUTOPLAY_DELAY_MS = 5000;
const USER_INTERACTION_PAUSE_MS = 7000;

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + "...";
};

const Home = () => {
  const { movies: featuredMovies, loading, error } = useMovieContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const resetAutoPlay = useCallback(() => {
    setIsPaused(true);
    const timer = setTimeout(
      () => setIsPaused(false),
      USER_INTERACTION_PAUSE_MS
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (featuredMovies.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === featuredMovies.length - 1 ? 0 : prevIndex + 1
        );
      }, AUTOPLAY_DELAY_MS);
      return () => clearInterval(interval);
    }
  }, [featuredMovies.length, isPaused]);

  const handlePrev = () => {
    resetAutoPlay();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? featuredMovies.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    resetAutoPlay();
    setCurrentIndex((prevIndex) =>
      prevIndex === featuredMovies.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading)
    return (
      <div className="home-container">
        <Header />
        <div className="content-wrapper">
          <p>Đang tải phim nổi bật...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="home-container">
        <Header />
        <div className="content-wrapper">
          <p>{error}</p>
        </div>
      </div>
    );

  if (featuredMovies.length === 0)
    return (
      <div className="home-container">
        <Header />
        <div className="content-wrapper">
          <p>Không tìm thấy phim nổi bật nào.</p>
        </div>
      </div>
    );

  const currentMovie = featuredMovies[currentIndex];

  return (
    <div className="main-header">
      <Header />
      <div className="home-container">
        <div className="content-wrapper">
          <div className="featured-movie-carousel">
            <div
              className="carousel-background"
              style={{ backgroundImage: `url(${currentMovie.image || ""})` }}
            >
              <div className="overlay"></div>
            </div>
            <button className="carousel-nav-button prev" onClick={handlePrev}>
              &lt;
            </button>
            <button className="carousel-nav-button next" onClick={handleNext}>
              &gt;
            </button>
            <div className="movie-details">
              <div className="main-movie-info">
                <h2>{currentMovie.name}</h2>
                <p>{currentMovie.description}</p>
                <button
                  className="watch-now-button"
                  onClick={() => handleMovieClick(currentMovie.id)}
                >
                  Xem Ngay
                </button>
              </div>
            </div>
            <div className="carousel-indicators">
              {featuredMovies.map((movie, index) => (
                <div
                  key={movie.id}
                  className={`indicator-dot ${
                    index === currentIndex ? "active" : ""
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    resetAutoPlay();
                  }}
                />
              ))}
            </div>
          </div>
          <UpNextSection movies={featuredMovies} truncateText={truncateText} />
        </div>
      </div>
    </div>
  );
};

export default Home;
