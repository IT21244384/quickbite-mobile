const mongoose = require('mongoose');

const CATEGORIES = ['Rice & Curry', 'Kottu', 'Burgers', 'Pizza', 'Noodles', 'Drinks', 'Desserts', 'Other'];

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    category: { type: String, required: true, enum: CATEGORIES },
    price: { type: Number, required: true, min: 0 },
    // How many portions can still be ordered today. Orders reduce it, cancellations restore it.
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    // Automatically set to false when stock reaches 0 (see orderController)
    isAvailable: { type: Boolean, default: true },
    // The image is stored inside MongoDB so it survives redeploys on hosts
    // like Render, whose local disk is wiped on every deploy.
    image: {
      data: { type: Buffer, select: false },
      contentType: String,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Only the URL is sent to the app, never the raw bytes
menuItemSchema.virtual('imageUrl').get(function imageUrl() {
  if (!this.image || !this.image.contentType) return null;
  // updatedAt is added so the app re-downloads the image after it changes
  return `/api/menu/${this._id}/image?v=${this.updatedAt ? this.updatedAt.getTime() : 0}`;
});

menuItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.image;
    delete ret.id;
    return ret;
  },
});

menuItemSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('MenuItem', menuItemSchema);
