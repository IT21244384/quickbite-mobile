const mongoose = require('mongoose');

const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

// Allowed status changes. Anything not listed here is rejected by the API.
const TRANSITIONS = {
  Pending: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Completed'],
  Completed: [],
  Cancelled: [],
};

const orderItemSchema = new mongoose.Schema(
  {
    // Reference to the primary entity
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    // Name and price are copied at order time, so later menu edits
    // do not silently change what the customer already agreed to pay.
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'An order needs at least one item'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.statics.STATUSES = STATUSES;
orderSchema.statics.TRANSITIONS = TRANSITIONS;

module.exports = mongoose.model('Order', orderSchema);
