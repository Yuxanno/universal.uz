// Mirfayz mijozning qarzini tekshirish scripti
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

async function checkMirfayzDebt() {
  try {
    // MongoDB URI - o'zgartiring agar kerak bo'lsa
    const MONGODB_URI = 'mongodb://localhost:27017/universal-pos';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');
    
    // Mirfayz mijozni topish
    const customer = await Customer.findOne({ name: /mirfayz/i });
    
    if (!customer) {
      console.log('❌ Mirfayz mijoz topilmadi');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📋 MIJOZ MA\'LUMOTLARI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Ism: ${customer.name}`);
    console.log(`Telefon: ${customer.phone}`);
    console.log(`Customer.debt (bazada): ${customer.debt.toLocaleString()} so'm`);
    console.log(`Jami xaridlar: ${(customer.totalPurchases || 0).toLocaleString()} so'm`);
    console.log(`ID: ${customer._id}`);
    
    // Qarz daftarchadagi ma'lumotlar
    const debts = await Debt.find({ 
      customer: customer._id,
      type: 'receivable'
    }).sort({ createdAt: 1 });
    
    console.log('\n📊 QARZ DAFTARCHA (Debts collection):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (debts.length === 0) {
      console.log('❌ Qarz daftarchada hech qanday qarz yo\'q');
    } else {
      let totalDebtAmount = 0;
      let totalPaidAmount = 0;
      let totalRemainingAmount = 0;
      
      debts.forEach((debt, index) => {
        const remaining = debt.amount - debt.paidAmount;
        totalDebtAmount += debt.amount;
        totalPaidAmount += debt.paidAmount;
        totalRemainingAmount += remaining;
        
        console.log(`\n${index + 1}. Qarz #${debt._id.toString().slice(-8)}`);
        console.log(`   Jami qarz: ${debt.amount.toLocaleString()} so'm`);
        console.log(`   To'langan: ${debt.paidAmount.toLocaleString()} so'm`);
        console.log(`   Qoldiq: ${remaining.toLocaleString()} so'm`);
        console.log(`   Status: ${debt.status}`);
        console.log(`   Sana: ${debt.createdAt.toLocaleDateString('uz-UZ')}`);
        if (debt.description) {
          console.log(`   Izoh: ${debt.description}`);
        }
        if (debt.payments && debt.payments.length > 0) {
          console.log(`   To'lovlar:`);
          debt.payments.forEach((payment, i) => {
            console.log(`     ${i + 1}. ${payment.amount.toLocaleString()} so'm (${payment.method})`);
          });
        }
      });
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 JAMI (Qarz daftarcha):');
      console.log(`   Jami qarz: ${totalDebtAmount.toLocaleString()} so'm`);
      console.log(`   To'langan: ${totalPaidAmount.toLocaleString()} so'm`);
      console.log(`   Qoldiq: ${totalRemainingAmount.toLocaleString()} so'm`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TAHLIL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (debts.length > 0) {
      const totalRemainingInDebts = debts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
      const customerDebt = customer.debt;
      
      console.log(`\n1️⃣  Qarz daftarcha (Debts): ${totalRemainingInDebts.toLocaleString()} so'm`);
      console.log(`2️⃣  Mijozlar (Customer.debt): ${customerDebt.toLocaleString()} so'm`);
      console.log(`\n❓ Farqi: ${Math.abs(totalRemainingInDebts - customerDebt).toLocaleString()} so'm`);
      
      if (totalRemainingInDebts === customerDebt) {
        console.log('\n✅ HAMMASI TO\'G\'RI! Ikki joy ham bir xil.');
      } else {
        console.log('\n⚠️  MUAMMO BOR! Ikki joy turlicha ko\'rsatyapti.');
        console.log('\n💡 YECHIM:');
        console.log(`   Customer.debt ni ${totalRemainingInDebts.toLocaleString()} so'mga yangilash kerak.`);
        console.log('\n   Buyruq:');
        console.log(`   node fix-mirfayz-debt.js`);
      }
    } else {
      if (customer.debt > 0) {
        console.log('\n⚠️  MUAMMO: Qarz daftarchada qarz yo\'q, lekin Customer.debt = ' + customer.debt.toLocaleString());
        console.log('\n💡 YECHIM: Customer.debt ni 0 ga yangilash kerak.');
      } else {
        console.log('\n✅ HAMMASI TO\'G\'RI! Hech qanday qarz yo\'q.');
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Tekshirish tugadi');
  } catch (error) {
    console.error('❌ Xato:', error.message);
    process.exit(1);
  }
}

checkMirfayzDebt();
