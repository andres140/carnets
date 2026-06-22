const service = require('../services/carnets.service');

function list(req, res) {
  try {
    res.json(service.listCarnets());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function create(req, res) {
  try {
    const carnet = service.createCarnet(req.body || {});
    res.status(201).json(carnet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function renew(req, res) {
  try {
    res.json(service.renewCarnet(req.params.codigo, req.body?.observacion));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function suspend(req, res) {
  try {
    res.json(service.suspendCarnet(req.params.codigo, req.body?.observacion));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function revoke(req, res) {
  try {
    res.json(service.revokeCarnet(req.params.codigo, req.body?.observacion));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = { list, create, renew, suspend, revoke };
