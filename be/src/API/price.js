const express = require('express');
const router = express.Router();
const Price = require('../models/Price');

router.get("/:priceId", async (req, res) => {
  try {
    const price = await Price.findOne({ priceId: req.params.priceId });
    if (!price) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }
    res.json(price);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;