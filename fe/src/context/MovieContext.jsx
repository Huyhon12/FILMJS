import React, { createContext, useState, useEffect, useContext } from "react";

// Tạo Context
const MovieContext = createContext();

// Tạo Provider Component để bọc các component con
export const MovieProvider = ({ children }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/movies");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Ánh xạ _id thành id để so sánh dễ dàng
        const processedData = data.map((movie) => ({
          ...movie,
          id: movie.movieId,
        }));
        setMovies(processedData);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu phim:", err);
        setError(`Không thể tải phim: ${err.message}.`);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  return (
    <MovieContext.Provider value={{ movies, loading, error }}>
      {children}
    </MovieContext.Provider>
  );
};

// Tạo một hook tùy chỉnh để dễ dàng truy cập Context
export const useMovieContext = () => {
  return useContext(MovieContext);
};
