const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card'], default: 'cash' },
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['manual', 'pos'], default: 'manual' } // Track where payment came from
});

const debtSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  creditorName: { type: String }, // For own debts (who you owe to)
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueDate: { type: Date, required: false }, // Optional - can be set or left empty
  status: { type: String, enum: ['pending', 'overdue', 'paid', 'blacklist'], default: 'pending' },
  type: { type: String, enum: ['receivable', 'payable'], default: 'receivable' }, // receivable = they owe me, payable = I owe them
  description: { type: String },
  collateral: { type: String }, // Garov - what was left as collateral
  receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' }, // Link to sale receipt
  payments: [paymentSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Compound indexes for optimal query performance
debtSchema.index({ type: 1, status: 1, updatedAt: -1 }); // Main query index
debtSchema.index({ customer: 1, type: 1, status: 1 }); // Customer lookup
debtSchema.index({ updatedAt: -1 }); // Latest first sorting
debtSchema.index({ createdAt: -1 }); // Creation date sorting
debtSchema.index({ dueDate: 1, status: 1 }); // Due date queries

module.exports = mongoose.model('Debt', debtSchema);
