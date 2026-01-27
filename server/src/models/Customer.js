const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
  type: { type: String, enum: ['purchase', 'debt_payment'], default: 'purchase' },
  debtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Debt' }, // For debt payments
  paymentMethod: { type: String, enum: ['cash', 'card', 'mixed'] } // Payment method
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: String,
  totalPurchases: { type: Number, default: 0 },
  debt: { type: Number, default: 0 },
  purchaseHistory: [purchaseHistorySchema], // Daily purchase history
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
