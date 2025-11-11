import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useMovieContext } from "../context/MovieContext";

// Hàm tiện ích: Chuẩn hóa chuỗi (Loại bỏ dấu tiếng Việt)
// Dùng chung cho cả SearchBar và SearchPage để tìm kiếm nhất quán
const normalizeString = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
};

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  // Thêm state để hỗ trợ điều hướng bằng phím mũi tên (UX nâng cao)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const { movies } = useMovieContext();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Xử lý đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logic Lọc Gợi ý (Autocomplete)
  const suggestions = useMemo(() => {
    const normalizedSearchTerm = normalizeString(searchTerm);

    if (!normalizedSearchTerm || normalizedSearchTerm.length < 2) {
      return [];
    }

    return movies
      .filter((movie) => {
        const movieName = normalizeString(movie.name);
        // Lọc phim có tên chứa từ khóa (tìm kiếm không dấu)
        return movieName.includes(normalizedSearchTerm);
      })
      .slice(0, 6);
  }, [movies, searchTerm]);

  // Xử lý khi click vào gợi ý hoặc footer
  const handleSuggestionAction = (e, moviePath = null, termToSearch = null) => {
    e.preventDefault();

    // Nếu là Link (gợi ý)
    if (moviePath) {
      navigate(moviePath);
    }
    // Nếu là Submit (footer hoặc nút tìm kiếm truyền thống)
    else if (termToSearch) {
      const trimmedTerm = termToSearch.trim();
      if (trimmedTerm) {
        navigate(`/search?q=${encodeURIComponent(trimmedTerm)}`);
      }
    }

    // Reset state sau mọi hành động tìm kiếm/điều hướng
    setSearchTerm("");
    setIsFocused(false);
    setActiveSuggestionIndex(-1);
  };

  // Xử lý phím (Enter, Mũi tên)
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) =>
        prevIndex > -1 ? prevIndex - 1 : -1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex > -1) {
        // Chọn gợi ý đang được focus
        const selectedMovie = suggestions[activeSuggestionIndex];
        handleSuggestionAction(e, `/movies/${selectedMovie.movieId}`);
      } else {
        // Thực hiện tìm kiếm truyền thống (nếu không có gợi ý nào được focus)
        handleSuggestionAction(e, null, searchTerm);
      }
    }
  };

  const showSuggestions =
    isFocused &&
    searchTerm.length >= 2 &&
    (suggestions.length > 0 || normalizeString(searchTerm).length > 0);

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <form
        className="search-form"
        onSubmit={(e) => handleSuggestionAction(e, null, searchTerm)}
      >
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setActiveSuggestionIndex(-1); // Reset index khi gõ mới
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <button type="submit" className="icon-button" aria-label="Tìm kiếm">
          <Search size={20} />
        </button>
      </form>

      {/* Dropdown Gợi ý (Autocomplete) */}
      {showSuggestions && (
        <div className="suggestions-dropdown">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((movie, index) => (
                <Link
                  key={movie.movieId}
                  to={`/movies/${movie.movieId}`}
                  className={`suggestion-item ${
                    index === activeSuggestionIndex ? "active" : ""
                  }`}
                  onClick={(e) =>
                    handleSuggestionAction(e, `/movies/${movie.movieId}`)
                  }
                  // Sử dụng onMouseEnter để cập nhật activeIndex khi di chuột
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                >
                  <img
                    src={movie.image}
                    alt={movie.name}
                    className="suggestion-image"
                    loading="lazy"
                  />
                  <div className="suggestion-info">
                    <p className="suggestion-title">{movie.name}</p>
                    {movie.latestEpisode && (
                      <p className="suggestion-episode">
                        {movie.latestEpisode}
                      </p>
                    )}
                  </div>
                </Link>
              ))}

              {/* Footer "Enter để tìm kiếm" */}
              <div
                className={`suggestion-footer ${
                  activeSuggestionIndex === -1 ? "active" : ""
                }`}
                onClick={(e) => handleSuggestionAction(e, null, searchTerm)}
              ></div>
            </>
          ) : (
            <p className="no-results-suggestion"></p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
