const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// Lấy danh sách tất cả phim
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/:movieId", async (req, res) => {
  try {
    const movie = await Movie.findOne({ movieId: req.params.movieId }); // Sử dụng movieId
    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy movie" });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/:movieId/video", async (req, res) => {
  try {
    const foundMovie = await Movie.findOne({ movieId: req.params.movieId });
    if (!foundMovie) {
      return res.status(404).json({ message: "Không tìm thấy movie" });
    }

    const videoUrl = foundMovie.movieUrl;
    if (!videoUrl) {
      return res.status(404).json({ message: "Không có video cho movie này" });
    }

    res.redirect(videoUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm một phim mới
router.post("/", async (req, res) => {
  const newMovie = new Movie({
    ...req.body
  });

  try {
    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ", details: err.message });
    }
    res.status(500).json({ message: "Lỗi khi thêm movie: " + err.message });
  }
});

// Cập nhật thông tin một phim theo movieId
router.patch("/:movieId", async (req, res) => {
  try {
    const updatedMovie = await Movie.findOneAndUpdate(
      { movieId: req.params.movieId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: "Không tìm thấy movie để cập nhật" });
    }

    res.json(updatedMovie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ", details: err.message });
    }
    res.status(500).json({ message: "Lỗi khi cập nhật movie: " + err.message });
  }
});

// Xóa một phim theo movieId
router.delete("/:movieId", async (req, res) => {
  try {
    const deletedMovie = await Movie.findOneAndDelete({ movieId: req.params.movieId }); // Sử dụng movieId
    if (!deletedMovie) {
      return res.status(404).json({ message: "Không tìm thấy movie để xóa" });
    }
    res.json({ message: "Movie đã được xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa movie: " + err.message });
  }
});

module.exports = router;