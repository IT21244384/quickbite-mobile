const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { reserveAll, releaseAll } = require('../utils/stock');

// ---------- helpers ----------

// Combines duplicate lines, e.g. two "Chicken Kottu x1" become one "x2"
function mergeLines(items) {
  const map = new Map();
  items.forEach(({ menuItem, quantity }) => {
    const key = String(menuItem);
    map.set(key, (map.get(key) || 0) + Number(quantity));
  });
  return [...map.entries()].map(([menuItem, quantity]) => {
    if (quantity > 20) throw new ApiError(400, 'Quantity for one item cannot exceed 20');
    return { menuItem, quantity };
  });
}

// Business rule: the total is always calculated on the server from the
// stored unit prices. The app never sends a price or total.
function calculateTotal(items) {
  return items.reduce((sum, i) => sum + i.subtotal, 0);
}

function buildLine(menuItemDoc, quantity, unitPrice = menuItemDoc.price) {
  return {
    menuItem: menuItemDoc._id,
    name: menuItemDoc.name,
    unitPrice,
    quantity,
    subtotal: unitPrice * quantity,
  };
}

async function findOrderForUser(req) {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String(order.user._id) === String(req.user._id);
  if (!isOwner && !req.user.isAdmin) throw new ApiError(403, 'You can only access your own orders');
  return { order, isOwner };
}

// ---------- handlers ----------

// POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const lines = mergeLines(req.body.items);

  // Take stock for every line first (all-or-nothing)
  const reserved = await reserveAll(lines);
  const items = reserved.map(({ line, item }) => buildLine(item, line.quantity));

  try {
    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount: calculateTotal(items),
      deliveryAddress: req.body.deliveryAddress,
      notes: req.body.notes,
      status: 'Pending',
      statusHistory: [{ status: 'Pending' }],
    });
    res.status(201).json(order);
  } catch (err) {
    // Saving failed, so give the stock back
    await releaseAll(lines);
    throw err;
  }
});

// GET /api/orders?status=   (customers see their own, admins see all)
const getOrders = asyncHandler(async (req, res) => {
  const filter = req.user.isAdmin ? {} : { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const { order } = await findOrderForUser(req);
  res.json(order);
});

// PUT /api/orders/:id   (owner only, while Pending)
// Change quantities, add/remove items, or change the address / notes.
const updateOrder = asyncHandler(async (req, res) => {
  const { order, isOwner } = await findOrderForUser(req);
  if (!isOwner) throw new ApiError(403, 'Only the customer who placed the order can edit it');
  if (order.status !== 'Pending') {
    throw new ApiError(409, `Order is ${order.status} and can no longer be edited`);
  }

  if (req.body.items) {
    const newLines = mergeLines(req.body.items);
    const oldQty = new Map(order.items.map((i) => [String(i.menuItem), i.quantity]));
    const newQty = new Map(newLines.map((l) => [String(l.menuItem), l.quantity]));

    // Work out how stock must change for each item
    const toReserve = [];
    const toRelease = [];
    new Set([...oldQty.keys(), ...newQty.keys()]).forEach((id) => {
      const diff = (newQty.get(id) || 0) - (oldQty.get(id) || 0);
      if (diff > 0) toReserve.push({ menuItem: id, quantity: diff });
      if (diff < 0) toRelease.push({ menuItem: id, quantity: -diff });
    });

    // Reserve increases first; if that fails nothing has changed yet
    const reserved = await reserveAll(toReserve);
    await releaseAll(toRelease);

    const reservedDocs = new Map(reserved.map((r) => [String(r.item._id), r.item]));
    const oldLines = new Map(order.items.map((i) => [String(i.menuItem), i]));

    // Existing lines keep the price the customer originally saw;
    // newly added lines use today's price. Total is then recalculated.
    order.items = newLines.map((l) => {
      const id = String(l.menuItem);
      const previous = oldLines.get(id);
      if (previous) {
        return {
          menuItem: previous.menuItem,
          name: previous.name,
          unitPrice: previous.unitPrice,
          quantity: l.quantity,
          subtotal: previous.unitPrice * l.quantity,
        };
      }
      return buildLine(reservedDocs.get(id), l.quantity);
    });
    order.totalAmount = calculateTotal(order.items);
  }

  if (req.body.deliveryAddress !== undefined) order.deliveryAddress = req.body.deliveryAddress;
  if (req.body.notes !== undefined) order.notes = req.body.notes;

  await order.save();
  res.json(order);
});

// PATCH /api/orders/:id/status   (admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { order } = await findOrderForUser(req);
  const next = req.body.status;

  const allowed = Order.TRANSITIONS[order.status];
  if (!allowed.includes(next)) {
    throw new ApiError(409, `Cannot change status from ${order.status} to ${next}`);
  }

  // Business rule: cancelling gives the portions back to the menu
  if (next === 'Cancelled') await releaseAll(order.items);

  order.status = next;
  order.statusHistory.push({ status: next });
  await order.save();
  res.json(order);
});

// PATCH /api/orders/:id/cancel   (owner, only while Pending)
const cancelOrder = asyncHandler(async (req, res) => {
  const { order, isOwner } = await findOrderForUser(req);
  if (!isOwner && !req.user.isAdmin) throw new ApiError(403, 'Not your order');
  if (order.status !== 'Pending') {
    throw new ApiError(409, `Order is ${order.status}; only Pending orders can be cancelled by the customer`);
  }

  await releaseAll(order.items);
  order.status = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled' });
  await order.save();
  res.json(order);
});

// DELETE /api/orders/:id
// Allowed for Pending (stock is released first), Cancelled and Completed orders.
// Orders in the kitchen (Preparing / Ready) cannot be deleted.
const deleteOrder = asyncHandler(async (req, res) => {
  const { order } = await findOrderForUser(req);

  if (['Preparing', 'Ready'].includes(order.status)) {
    throw new ApiError(409, `Order is ${order.status} and cannot be deleted`);
  }
  if (order.status === 'Pending') await releaseAll(order.items);

  await order.deleteOne();
  res.json({ message: 'Order deleted', _id: order._id });
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
};
