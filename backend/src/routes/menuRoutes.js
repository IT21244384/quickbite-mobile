const express = require('express');
const ctrl = require('../controllers/menuController');
const rules = require('../validators/menuValidators');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public: the image endpoint, so the app's <Image> component can load it by URL
router.get('/:id/image', rules.idParam, validate, ctrl.getMenuItemImage);

// Everything below needs a logged-in user
router.use(protect);

router.get('/categories', ctrl.getCategories);
router.get('/', rules.listRules, validate, ctrl.getMenuItems);
router.get('/:id', rules.idParam, validate, ctrl.getMenuItem);

// Admin only. `upload` runs first so multer fills req.body from the multipart form.
router.post('/', adminOnly, upload, rules.createRules, validate, ctrl.createMenuItem);
router.put('/:id', adminOnly, upload, rules.updateRules, validate, ctrl.updateMenuItem);
router.delete('/:id', adminOnly, rules.idParam, validate, ctrl.deleteMenuItem);

module.exports = router;
