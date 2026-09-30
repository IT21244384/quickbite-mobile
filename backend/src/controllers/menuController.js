const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const ACTIVE_STATUSES = ['Pending', 'Preparing', 'Ready'];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/menu?category=&search=&available=
const getMenuItems = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.available) filter.isAvailable = req.query.available === 'true';
  if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  res.json(items);
});

// GET /api/menu/categories
const getCategories = (req, res) => {
  res.json(MenuItem.CATEGORIES);
};

// GET /api/menu/:id
const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');
  res.json(item);
});

// GET /api/menu/:id/image  (public, so <Image> can load it directly)
const getMenuItemImage = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).select('+image.data');
  if (!item || !item.image || !item.image.data) throw new ApiError(404, 'Image not found');

  res.set('Content-Type', item.image.contentType);
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(item.image.data);
});

// POST /api/menu  (admin, multipart/form-data)
const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, stockQuantity, isAvailable } = req.body;

  const item = new MenuItem({
    name,
    description,
    category,
    price,
    stockQuantity,
    // An item with no stock can never be available
    isAvailable: stockQuantity === 0 ? false : isAvailable !== false,
    createdBy: req.user._id,
  });

  if (req.file) {
    item.image = { data: req.file.buffer, contentType: req.file.mimetype };
  }

  await item.save();
  res.status(201).json(item);
});

// PUT /api/menu/:id  (admin, multipart/form-data, all fields optional)
const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');

  const fields = ['name', 'description', 'category', 'price', 'stockQuantity', 'isAvailable'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) item[f] = req.body[f];
  });

  if (req.file) {
    item.image = { data: req.file.buffer, contentType: req.file.mimetype };
  }

  // Business rule: no stock means not available, whatever the admin ticked
  if (item.stockQuantity === 0) item.isAvailable = false;

  await item.save();
  res.json(item);
});

// DELETE /api/menu/:id  (admin)
const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');

  // Business rule: an item that is part of an order still being handled cannot be removed
  const activeOrders = await Order.countDocuments({
    'items.menuItem': item._id,
    status: { $in: ACTIVE_STATUSES },
  });
  if (activeOrders > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${activeOrders} active order(s) contain this item. Mark it unavailable instead.`
    );
  }

  await item.deleteOne();
  res.json({ message: 'Menu item deleted', _id: item._id });
});

module.exports = {
  getMenuItems,
  getCategories,
  getMenuItem,
  getMenuItemImage,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
