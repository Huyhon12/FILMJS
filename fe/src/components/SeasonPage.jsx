import { useParams } from "react-router-dom";
import { useMovieContext } from "../context/MovieContext";
import Header from "./Header";
import { Link } from "react-router-dom";
import "../css/SeasonPage.css";

const SeasonPage = () => {
  const { season } = useParams();
  const { movies } = useMovieContext();

  const filteredMovies = movies.filter(
    (movie) => movie.season === Number(season)
  );

  return (
    <div className="main-layout">
      <Header />
      <div className="season-page-content">
        {filteredMovies.length > 0 ? (
          <div className="movie-list-container">
            {filteredMovies.map((movie) => (
              <Link
                key={movie.movieId}
                to={`/movies/${movie.movieId}`}
                className="movie-cardd-link"
              >
                <div className="movie-cardd ">
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
            Rất tiếc, chúng tôi không tìm thấy phim nào trong năm {season}.
          </p>
        )}
      </div>
    </div>
  );
};

export default SeasonPage;
