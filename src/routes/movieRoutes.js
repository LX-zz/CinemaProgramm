const express = require('express');
const movieController = require('../controllers/movieController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);
router.post('/', adminAuth, movieController.createMovie);
router.put('/:id', adminAuth, movieController.updateMovie);
router.delete('/:id', adminAuth, movieController.deleteMovie);

module.exports = router;