const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');

router.post('/', async (req, res) => {
    const { customerId, movieId } = req.body;
    
    if (!customerId || !movieId) {
        return res.status(400).json({ message: 'Thiếu thông tin customerId hoặc movieId.' });
    }
    
    const customer = Number(customerId);
    const movie = Number(movieId);

    try {
        const watchlistDoc = await Watchlist.findOneAndUpdate(
            { customerId: customer },
            {},
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const isMovieInList = watchlistDoc.movies.some(item => item.movieId === movie);

        if (isMovieInList) {
            await Watchlist.updateOne(
                { customerId: customer },
                { $pull: { movies: { movieId: movie } } }
            );
            return res.status(200).json({ 
                message: 'Đã xóa phim khỏi danh sách yêu thích.',
                action: 'removed' 
            });
        }
        
        const updatedDoc = await Watchlist.findOneAndUpdate(
            { customerId: customer },
            { $push: { movies: { movieId: movie, createdAt: new Date() } } },
            { new: true }
        );

        return res.status(201).json({
            message: 'Đã thêm phim vào danh sách yêu thích thành công!',
            item: updatedDoc.movies.find(m => m.movieId === movie),
            action: 'added'
        });

    } catch (error) {
        console.error('Lỗi khi thêm/xóa Watchlist:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

router.get('/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            return res.status(400).json({ message: 'Thiếu Customer ID.' });
        }

        const watchlistDoc = await Watchlist.findOne({ customerId: Number(customerId) });
        
        if (!watchlistDoc) {
             return res.status(200).json({ message: 'Danh sách yêu thích trống.', data: [] });
        }

        // Sắp xếp theo thời gian thêm mới nhất
        const sortedMovies = watchlistDoc.movies.sort((a, b) => b.createdAt - a.createdAt);
        
        return res.status(200).json({
            message: 'Tải danh sách yêu thích thành công.',
            data: sortedMovies
        });

    } catch (error) {
        console.error('Lỗi khi tải Watchlist:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

router.delete('/:customerId/:movieId', async (req, res) => {
    try {
        const { customerId, movieId } = req.params;

        if (!customerId || !movieId) {
            return res.status(400).json({ message: 'Thiếu Customer ID hoặc Movie ID.' });
        }

        const result = await Watchlist.updateOne(
            { customerId: Number(customerId) },
            { $pull: { movies: { movieId: Number(movieId) } } }
        );

        if (result.modifiedCount === 0) {
             const docExists = await Watchlist.findOne({ customerId: Number(customerId) });
             if (!docExists) {
                return res.status(404).json({ message: 'Không tìm thấy danh sách yêu thích.' });
             } else {
                return res.status(404).json({ message: 'Phim không có trong danh sách yêu thích (hoặc đã bị xóa).' });
             }
        }

        return res.status(200).json({ 
            message: 'Đã xóa phim khỏi danh sách yêu thích thành công.' 
        });

    } catch (error) {
        console.error('Lỗi khi xóa khỏi Watchlist:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

module.exports = router;