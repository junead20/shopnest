const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Get personalized product recommendations for the logged-in user
 * @access  Private
 */
router.get('/personalized', authMiddleware, async (req, res) => {
    try {
        const recommendations = await recommendationService.getPersonalizedRecommendations(req.user.id);
        res.json(recommendations);
    } catch (error) {
        console.error('Error fetching personalized recommendations:', error);
        res.status(500).json({ message: 'Error fetching recommendations' });
    }
});

/**
 * @route   GET /api/recommendations/similar/:productId
 * @desc    Get products similar to a specific product
 * @access  Public
 */
router.get('/similar/:productId', async (req, res) => {
    try {
        const similarProducts = await recommendationService.getSimilarProducts(req.params.productId);
        res.json(similarProducts);
    } catch (error) {
        console.error('Error fetching similar products:', error);
        res.status(500).json({ message: 'Error fetching similar products' });
    }
});

module.exports = router;
