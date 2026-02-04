// Mirfayz mijozning qarzini tuzatish scripti
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  debt: Number,
  totalPurchases: Number,
  purchaseHistory: Array
}, { timestamps: true });

const debtSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  type: String,
  amount: Number,
  paidAmount: { type: Number, default: 0 },
  status: String,
  payments: Array,
  description: String,
  dueDate: Date
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
const Debt = mongoose.model('Debt', debtSchema);

async function fixMirfayzDebt() {
  try {
    // MongoDB URI
    const MONGODB_URI = 'mongodb+srv://universaldb85_db_user:Qp3xMAZWHrk46KuR@cluster0.esra7ri.mongodb.net/v';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');
    
    // Mirfayz mijozni topish
    const customer = await Customer.findOne({ name: /mirfayz/i });
    
    if (!customer) {
      console.log('❌ Mirfayz mijoz topilmadi');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📋 HOZIRGI HOLAT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Mijoz: ${customer.name}`);
    console.log(`Hozirgi Customer.debt: ${customer.debt.toLocaleString()} so'm`);
    
    // Qarz daftarchadagi haqiqiy qarzni hisoblash
    const debts = await Debt.find({ 
      customer: customer._id,
      type: 'receivable'
    });
    
    const totalRemainingDebt = debts.reduce((sum, debt) => {
      return sum + (debt.amount - debt.paidAmount);
    }, 0);
    
    console.log(`Qarz daftarchadagi haqiqiy qarz: ${totalRemainingDebt.toLocaleString()} so'm`);
    console.log(`Farqi: ${Math.abs(totalRemainingDebt - customer.debt).toLocaleString()} so'm`);
    
    if (totalRemainingDebt === customer.debt) {
      console.log('\n✅ Hammasi to\'g\'ri! Tuzatish kerak emas.');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n⚠️  Tuzatish kerak!');
    console.log('\n❓ Davom ettirilsinmi? (Ctrl+C - bekor qilish)');
    
    // 3 soniya kutish
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔧 TUZATISH BOSHLANDI...');
    
    // Customer.debt ni yangilash
    customer.debt = totalRemainingDebt;
    await customer.save();
    
    console.log('\n✅ MUVAFFAQIYATLI TUZATILDI!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Yangi Customer.debt: ${customer.debt.toLocaleString()} so'm`);
    console.log(`Qarz daftarcha: ${totalRemainingDebt.toLocaleString()} so'm`);
    console.log('\n✅ Endi ikki joy ham bir xil!');
    
    await mongoose.disconnect();
    console.log('\n✅ Tugadi');
  } catch (error) {
    console.error('❌ Xato:', error.message);
    process.exit(1);
  }
}

fixMirfayzDebt();
