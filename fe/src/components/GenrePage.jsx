import { useParams } from "react-router-dom";
import { useMovieContext } from "../context/MovieContext";
import Header from "./Header";
import { Link } from "react-router-dom";
import "../css/SeasonPage.css";

const GenrePage = () => {
  const { genre } = useParams();
  const { movies } = useMovieContext();

  const filteredMovies = movies.filter((movie) => {
    const normalizedGenre = genre ? genre.toLowerCase() : "";

    return (
      Array.isArray(movie.genres) &&
      movie.genres.some(
        (movieGenre) => movieGenre.toLowerCase() === normalizedGenre
      )
    );
  });
  return (
    <div className="main-layout">
      <Header />
      <div className="season-page-content">
        {/* Có thể thay đổi tiêu đề trang tại đây, ví dụ: Phim thể loại {genre} */}
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="no-results">
            Rất tiếc, chúng tôi không tìm thấy phim nào thuộc thể loại **{genre}
            **.
          </p>
        )}
      </div>
    </div>
  );
};

export default GenrePage;
