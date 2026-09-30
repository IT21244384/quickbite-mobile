const MenuItem = require('../models/MenuItem');
const ApiError = require('./ApiError');

// Takes `quantity` portions of a menu item.
// The check and the decrement happen in ONE database operation, so two customers
// ordering the last portion at the same time cannot both succeed.
async function reserveStock(menuItemId, quantity) {
  const item = await MenuItem.findOneAndUpdate(
    { _id: menuItemId, isAvailable: true, stockQuantity: { $gte: quantity } },
    { $inc: { stockQuantity: -quantity } },
    { new: true }
  );

  if (!item) {
    // Work out why it failed so the app can show a useful message
    const current = await MenuItem.findById(menuItemId);
    if (!current) throw new ApiError(404, 'A menu item in this order no longer exists');
    if (!current.isAvailable) throw new ApiError(409, `${current.name} is not available right now`);
    throw new ApiError(409, `Only ${current.stockQuantity} portion(s) of ${current.name} left`);
  }

  // Sold out -> hide it from ordering
  if (item.stockQuantity === 0) {
    item.isAvailable = false;
    await item.save();
  }
  return item;
}

// Gives `quantity` portions back (order cancelled, deleted or reduced).
async function releaseStock(menuItemId, quantity) {
  const item = await MenuItem.findByIdAndUpdate(
    menuItemId,
    { $inc: { stockQuantity: quantity } },
    { new: true }
  );
  if (!item) return null; // item was deleted; nothing to give back

  // If it was unavailable only because it had sold out, it can be ordered again
  const wasSoldOut = item.stockQuantity === quantity;
  if (wasSoldOut && !item.isAvailable) {
    item.isAvailable = true;
    await item.save();
  }
  return item;
}

// Reserves every line; if any line fails, gives back what was already taken.
async function reserveAll(lines) {
  const reserved = [];
  try {
    for (const line of lines) {
      const item = await reserveStock(line.menuItem, line.quantity);
      reserved.push({ line, item });
    }
    return reserved;
  } catch (err) {
    await Promise.all(reserved.map((r) => releaseStock(r.line.menuItem, r.line.quantity)));
    throw err;
  }
}

async function releaseAll(lines) {
  await Promise.all(lines.map((l) => releaseStock(l.menuItem, l.quantity)));
}

module.exports = { reserveStock, releaseStock, reserveAll, releaseAll };
