const express = require('express');
const router = express.Router();
const WatchHistory = require('../models/WatchHistory');

router.post('/', async(req, res) => {
    const { customerId, movieId } = req.body;

    if (!customerId || !movieId) {
        return res.status(400).json({ message: 'Thiếu thông tin customerId hoặc movieId.' });
    }
    
    const customer = Number(customerId);
    const movie = Number(movieId);
    const currentTime = new Date();

    try {
        const existingDoc = await WatchHistory.findOne({ customerId: customer });
        if (existingDoc && existingDoc.movies.length > 0) {
            const latestAction = existingDoc.movies[0]; 
            
            if (latestAction.movieId === movie && (currentTime - latestAction.createdAt) < 10000) {
                 return res.status(200).json({ message: 'Đã bỏ qua yêu cầu trùng lặp trong 10 giây.', data: latestAction });
            }
        }
        
        await WatchHistory.updateOne(
            { customerId: customer },
            { $pull: { movies: { movieId: movie } } }
        );

        const updatedDoc = await WatchHistory.findOneAndUpdate(
            { customerId: customer },
            { 
                $push: { 
                    movies: { 
                        $each: [{ movieId: movie, createdAt: currentTime }],
                        $position: 0,
                    }
                }
            }, 
            { new: true, upsert: true }
        );

        return res.status(200).json({ 
            message: 'Đã lưu/cập nhật lịch sử xem (mới nhất ở đầu).', 
            data: updatedDoc.movies[0]
        });

    } catch (error) {
        console.error('Lỗi khi lưu lịch sử xem:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

router.get('/:customerId' , async (req , res) => {
    const { customerId } = req.params;

    if (!customerId) {
        return res.status(400).json({ message: 'Thiếu Customer ID.' });
    }

    try {
        const historyDoc = await WatchHistory.findOne({ customerId: Number(customerId) });
        
        if (!historyDoc) {
             return res.status(200).json({ message: 'Lịch sử xem trống.', data: [] });
        }

        return res.status(200).json({ 
            message: 'Tải lịch sử xem thành công.',
            data: historyDoc.movies 
        });

    } catch (error) {
        console.error('Lỗi khi tải lịch sử xem:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

router.delete('/:customerId/:movieId', async (req, res) => {
    const { customerId, movieId } = req.params;

    if (!customerId || !movieId) {
        return res.status(400).json({ message: 'Thiếu Customer ID hoặc Movie ID.' });
    }

    try {
        const result = await WatchHistory.updateOne(
            { customerId: Number(customerId) },
            { $pull: { movies: { movieId: Number(movieId) } } }
        );

        if (result.modifiedCount === 0) {
             const docExists = await WatchHistory.findOne({ customerId: Number(customerId) });
             
             if (!docExists) {
               return res.status(404).json({ message: 'Không tìm thấy lịch sử xem.' });
             } else {
               return res.status(404).json({ message: 'Phim không có trong lịch sử xem.' });
             }
        }

        return res.status(200).json({ 
            message: 'Đã xóa phim khỏi lịch sử xem thành công.' 
        });

    } catch (error) {
        console.error('Lỗi khi xóa một mục lịch sử xem:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

router.delete('/:customerId', async(req , res) => {
    const { customerId } = req.params;

    if (!customerId) {
        return res.status(400).json({ message: 'Thiếu Customer ID.' });
    }

    try {
        const result = await WatchHistory.deleteOne({ customerId: Number(customerId) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lịch sử xem để xóa.' });
        }
        
        return res.status(200).json({ 
            message: `Đã xóa toàn bộ lịch sử xem cho customerId: ${customerId}.`
        });
        
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử xem:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
});

module.exports = router;