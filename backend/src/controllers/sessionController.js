const Session = require('../models/Session');

exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSessionsByMovie = async (req, res) => {
  try {
    const sessions = await Session.findByMovie(req.params.movieId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAvailableSeats = async (req, res) => {
  try {
    const seats = await Session.getAvailableSeats(req.params.id);
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};