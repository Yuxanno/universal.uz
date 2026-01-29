const mongoose = require('mongoose');

const printerSettingsSchema = new mongoose.Schema({
  // Receipt Printer Settings
  receiptPrinter: {
    enabled: { type: Boolean, default: true },
    printerName: { type: String, default: 'XPrinter XP-365B' },
    paperWidth: { type: Number, default: 76 }, // mm
    autoprint: { type: Boolean, default: true },
    copies: { type: Number, default: 1 },
    // ESC/POS settings
    interface: { type: String, enum: ['usb', 'network', 'bluetooth'], default: 'usb' },
    ipAddress: String, // for network printers
    port: Number, // for network printers
  },
  
  // QR Code Printer Settings
  qrPrinter: {
    enabled: { type: Boolean, default: false },
    printerName: String,
    qrSize: { type: Number, default: 200 }, // pixels
    autoprint: { type: Boolean, default: false },
  },
  
  // Receipt Template Settings
  template: {
    showLogo: { type: Boolean, default: true },
    logoPath: { type: String, default: '/chek_logo.jpg' },
    fontSize: { type: Number, default: 13 },
    itemNameSize: { type: Number, default: 13 },
    showContacts: { type: Boolean, default: true },
    footerMessage: { type: String, default: 'Xaridingiz uchun rahmat!\nSizga omad tilaymiz!' },
  },
  
  // Auto-print Settings
  autoprint: {
    onPayment: { type: Boolean, default: true },
    showPreview: { type: Boolean, default: false },
    silentPrint: { type: Boolean, default: true },
  },
  
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('PrinterSettings', printerSettingsSchema);
