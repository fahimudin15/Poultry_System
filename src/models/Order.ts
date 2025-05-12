import mongoose from 'mongoose';

// Counter schema for auto-incrementing IDs
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const OrderSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  customerName: {
    type: String,
    required: true,
  },
  numberOfCrates: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  dueTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: true,
});

// Pre-save middleware to auto-increment ID
OrderSchema.pre('save', async function(next) {
  try {
    if (!this.id) {  // Only set ID if it's not already set
      const counter = await Counter.findByIdAndUpdate(
        'orderId',
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      this.id = counter.seq;
    }
    next();
  } catch (error) {
    if (error instanceof Error) {
      next(error);
    } else {
      next(new Error('An unknown error occurred'));
    }
  }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema); 