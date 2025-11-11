import React from "react";
import "../css/UpNextSection.css";
import { useNavigate } from "react-router-dom";

const UpNextSection = ({ movies }) => {
  const navigate = useNavigate();

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  return (
    <div className="up-next-section">
      <h3>Up next</h3>
      {movies.slice(0, 5).map((movie) => (
        <div
          key={movie.id}
          className="trailer-item"
          onClick={() => handleMovieClick(movie.id)}
        >
          <div className="thumbnail-wrapper">
            <img src={movie.image} alt={movie.name} />
            <button className="play-button-small">▶</button>
          </div>
          <div className="trailer-info">
            <p className="trailer-title">{movie.name}</p>
            <p className="trailer-description">{movie.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpNextSection;
