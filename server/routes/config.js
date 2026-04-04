// 配置 API — GET/POST
const express = require('express');
const router = express.Router();
const store = require('../store');

router.get('/', (req, res) => {
  res.json(store.loadConfig());
});

router.post('/', (req, res) => {
  store.saveConfig(req.body);
  res.json({ success: true });
});

module.exports = router;
