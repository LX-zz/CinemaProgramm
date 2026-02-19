const Hall = require('../models/Hall');

exports.getAllHalls = async (req, res) => {
  try {
    const halls = await Hall.findAll();
    res.json(halls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHallById = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json(hall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHall = async (req, res) => {
  try {
    const hall = await Hall.create(req.body);
    res.status(201).json(hall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHallSeats = async (req, res) => {
  try {
    const seats = await Hall.getSeats(req.params.id);
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};