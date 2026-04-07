const express = require('express');
const { getScripts, createScript, deleteScript } = require('../controllers/scriptController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(authorize('admin', 'employee'), getScripts)
    .post(authorize('admin'), createScript);

router
    .route('/:id')
    .delete(authorize('admin'), deleteScript);

module.exports = router;
