// 账户 API — GET/POST/DELETE
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../store');

// 获取所有账户
router.get('/', (req, res) => {
  res.json(store.loadAccounts());
});

// 添加账户
router.post('/', (req, res) => {
  const account = req.body;
  const accounts = store.loadAccounts();

  if (!account.id) {
    account.id = crypto.randomUUID();
  }
  if (account.type === 'offline' && !account.uuid) {
    account.uuid = store.generateOfflineUUID(account.username);
  }

  accounts.push(account);
  store.saveAccounts(accounts);
  res.json(account);
});

// 删除账户
router.delete('/:id', (req, res) => {
  const accounts = store.loadAccounts();
  const filtered = accounts.filter(a => a.id !== req.params.id);
  store.saveAccounts(filtered);
  res.json({ success: true });
});

module.exports = router;
