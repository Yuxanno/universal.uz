// Customer Telegram Bot - For customers to check their debts
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const Customer = require('../models/Customer');
const Debt = require('../models/Debt');

let customerBot = null;
let customerData = {}; // { chatId: { phone: string, customerId: string, name: string } }

// File to persist customer data
const customerDataFile = path.join(__dirname, '../../.telegram_customers.json');

/**
 * Load saved customer data from file
 */
const loadCustomerData = () => {
  try {
    if (fs.existsSync(customerDataFile)) {
      const data = fs.readFileSync(customerDataFile, 'utf8');
      customerData = JSON.parse(data);
      console.log(`📱 Loaded ${Object.keys(customerData).length} customer(s)`);
    }
  } catch (error) {
    console.error('Error loading customer data:', error);
  }
};

/**
 * Save customer data to file
 */
const saveCustomerData = () => {
  try {
    fs.writeFileSync(customerDataFile, JSON.stringify(customerData, null, 2));
  } catch (error) {
    console.error('Error saving customer data:', error);
  }
};

/**
 * Format number with spaces
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Format phone number
 */
const formatPhone = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 998, keep it
  if (cleaned.startsWith('998')) {
    return cleaned;
  }
  
  // If starts with +998, remove +
  if (phone.startsWith('+998')) {
    return cleaned;
  }
  
  // If starts with 0, replace with 998
  if (cleaned.startsWith('0')) {
    return '998' + cleaned.substring(1);
  }
  
  // Otherwise add 998
  return '998' + cleaned;
};

/**
 * Find customer by phone
 */
const findCustomerByPhone = async (phone) => {
  try {
    const formattedPhone = formatPhone(phone);
    
    // Try exact match first
    let customer = await Customer.findOne({ phone: formattedPhone });
    
    if (customer) return customer;
    
    // Try without country code
    if (formattedPhone.startsWith('998')) {
      const withoutCode = formattedPhone.substring(3);
      customer = await Customer.findOne({ 
        $or: [
          { phone: withoutCode },
          { phone: '0' + withoutCode },
          { phone: '+' + formattedPhone },
          { phone: '+998' + withoutCode }
        ]
      });
    }
    
    if (customer) return customer;
    
    // Try with different formats
    const cleanPhone = phone.replace(/\D/g, '');
    customer = await Customer.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: '+' + cleanPhone },
        { phone: '998' + cleanPhone.substring(cleanPhone.length - 9) },
        { phone: cleanPhone.substring(cleanPhone.length - 9) }
      ]
    });
    
    return customer;
  } catch (error) {
    console.error('Error finding customer:', error);
    return null;
  }
};

/**
 * Get customer debts (including paid ones for history)
 */
const getCustomerDebts = async (customerId) => {
  try {
    const debts = await Debt.find({
      customer: customerId,
      type: 'receivable'
    }).sort({ dueDate: 1 });
    
    return debts;
  } catch (error) {
    console.error('Error getting debts:', error);
    return [];
  }
};

/**
 * Get customer statistics
 */
const getCustomerStats = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);
    const debts = await Debt.find({
      customer: customerId,
      type: 'receivable'
    });
    
    // Calculate totals
    let totalDebt = 0;        // Jami qarz (barcha qarzlar)
    let totalPaid = 0;        // To'langan summa
    let remainingDebt = 0;    // Qolgan qarz (faqat pending/overdue)
    
    debts.forEach(debt => {
      totalDebt += debt.amount;
      totalPaid += debt.paidAmount;
      
      // Only count unpaid debts
      if (debt.status === 'pending' || debt.status === 'overdue') {
        remainingDebt += (debt.amount - debt.paidAmount);
      }
    });
    
    return {
      totalPurchases: customer.totalPurchases || 0,  // Jami xaridlar
      totalDebt,                                      // Jami qarz
      totalPaid,                                      // To'langan
      remainingDebt,                                  // Qolgan qarz
      activeDebtsCount: debts.filter(d => d.status === 'pending' || d.status === 'overdue').length,
      paidDebtsCount: debts.filter(d => d.status === 'paid').length
    };
  } catch (error) {
    console.error('Error getting customer stats:', error);
    return null;
  }
};

/**
 * Send debt information to customer
 */
const sendDebtInfo = async (chatId, customer, debts) => {
  // Get customer statistics
  const stats = await getCustomerStats(customer._id);
  
  if (!stats) {
    await customerBot.sendMessage(chatId, '❌ Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    return;
  }
  
  // Filter only active debts for detailed list
  const activeDebts = debts.filter(d => d.status === 'pending' || d.status === 'overdue');
  
  let message = `📊 *Hisobot - ${customer.name}*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Main statistics
  message += `💰 *Moliyaviy Ma'lumotlar:*\n\n`;
  message += `🛒 Jami xaridlar: *${formatNumber(stats.totalPurchases)} so'm*\n`;
  message += `📋 Jami qarz: *${formatNumber(stats.totalDebt)} so'm*\n`;
  message += `✅ To'langan: *${formatNumber(stats.totalPaid)} so'm*\n`;
  message += `⏳ Qolgan qarz: *${formatNumber(stats.remainingDebt)} so'm*\n\n`;
  
  // Payment progress bar
  if (stats.totalDebt > 0) {
    const paymentPercent = Math.round((stats.totalPaid / stats.totalDebt) * 100);
    const progressBar = generateProgressBar(paymentPercent);
    message += `📈 To'lov jarayoni: ${progressBar} ${paymentPercent}%\n\n`;
  }
  
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Check if customer has any debt
  if (stats.remainingDebt === 0) {
    message += `✅ *Ajoyib!*\n\n`;
    message += `Sizda hech qanday qarz yo'q.\n`;
    message += `Barcha qarzlaringiz to'langan! 🎉\n\n`;
    
    if (stats.paidDebtsCount > 0) {
      message += `📜 To'langan qarzlar: ${stats.paidDebtsCount} ta\n`;
    }
    
    message += `\nXaridlaringiz uchun rahmat! 🙏`;
  } else {
    // Active debts details
    message += `⚠️ *Faol Qarzlar (${activeDebts.length} ta):*\n\n`;
    
    activeDebts.forEach((debt, index) => {
      const remaining = debt.amount - debt.paidAmount;
      const dueDate = new Date(debt.dueDate).toLocaleDateString('uz-UZ');
      const isOverdue = new Date(debt.dueDate) < new Date();
      const statusEmoji = isOverdue ? '🔴' : '🟡';
      
      message += `${statusEmoji} *${index + 1}. Qarz*\n`;
      message += `   💵 Summa: ${formatNumber(debt.amount)} so'm\n`;
      
      if (debt.paidAmount > 0) {
        message += `   ✅ To'langan: ${formatNumber(debt.paidAmount)} so'm\n`;
        message += `   ⏳ Qolgan: ${formatNumber(remaining)} so'm\n`;
      } else {
        message += `   ⏳ Qolgan: ${formatNumber(remaining)} so'm\n`;
      }
      
      message += `   📅 Muddat: ${dueDate}`;
      if (isOverdue) {
        const daysOverdue = Math.floor((new Date() - new Date(debt.dueDate)) / (1000 * 60 * 60 * 24));
        message += ` ⚠️ *${daysOverdue} kun kechikkan*`;
      }
      message += `\n`;
      
      if (debt.description) {
        message += `   📝 Izoh: ${debt.description}\n`;
      }
      
      if (debt.collateral) {
        message += `   🔒 Garov: ${debt.collateral}\n`;
      }
      
      // Show payment history if exists
      if (debt.payments && debt.payments.length > 0) {
        message += `   💳 To'lovlar:\n`;
        debt.payments.slice(-2).forEach(payment => {
          const payDate = new Date(payment.date).toLocaleDateString('uz-UZ');
          message += `      • ${formatNumber(payment.amount)} so'm (${payDate})\n`;
        });
      }
      
      message += `\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📞 *Aloqa:*\n`;
    message += `To'lov qilish yoki savol bo'lsa, biz bilan bog'laning.\n\n`;
  }
  
  message += `🏪 *Universal Savdo Markazi*`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔄 Yangilash', callback_data: 'refresh_debt' },
        { text: '📊 Statistika', callback_data: 'show_stats' }
      ],
      [
        { text: '📞 Bog\'lanish', url: 'tel:+998901234567' }
      ]
    ]
  };

  await customerBot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * Generate progress bar
 */
const generateProgressBar = (percent) => {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
};

/**
 * Send detailed statistics
 */
const sendDetailedStats = async (chatId, customerId) => {
  try {
    const customer = await Customer.findById(customerId);
    const stats = await getCustomerStats(customerId);
    
    if (!customer || !stats) {
      await customerBot.sendMessage(chatId, '❌ Ma\'lumotlarni yuklashda xatolik.');
      return;
    }
    
    let message = `📊 *Batafsil Statistika*\n\n`;
    message += `👤 Mijoz: ${customer.name}\n`;
    message += `📞 Telefon: ${customer.phone}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `💰 *Moliyaviy Ko'rsatkichlar:*\n\n`;
    message += `🛒 Jami xaridlar:\n   ${formatNumber(stats.totalPurchases)} so'm\n\n`;
    message += `📋 Jami qarz:\n   ${formatNumber(stats.totalDebt)} so'm\n\n`;
    message += `✅ To'langan summa:\n   ${formatNumber(stats.totalPaid)} so'm\n\n`;
    message += `⏳ Qolgan qarz:\n   ${formatNumber(stats.remainingDebt)} so'm\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `📈 *Qarzlar Holati:*\n\n`;
    message += `🟡 Faol qarzlar: ${stats.activeDebtsCount} ta\n`;
    message += `✅ To'langan qarzlar: ${stats.paidDebtsCount} ta\n\n`;
    
    if (stats.totalDebt > 0) {
      const paymentPercent = Math.round((stats.totalPaid / stats.totalDebt) * 100);
      message += `📊 To'lov foizi: ${paymentPercent}%\n`;
      message += `${generateProgressBar(paymentPercent)}\n\n`;
    }
    
    // Calculate debt ratio
    if (stats.totalPurchases > 0) {
      const debtRatio = Math.round((stats.remainingDebt / stats.totalPurchases) * 100);
      message += `💳 Qarz nisbati: ${debtRatio}%\n`;
      message += `(Xaridlarga nisbatan qolgan qarz)\n\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 Sana: ${new Date().toLocaleString('uz-UZ')}\n\n`;
    message += `🏪 Universal Savdo Markazi`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 Orqaga', callback_data: 'refresh_debt' }
        ]
      ]
    };
    
    await customerBot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error sending detailed stats:', error);
    await customerBot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
  }
};

/**
 * Initialize customer bot
 */
const initCustomerBot = () => {
  const BOT_TOKEN = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
  
  if (!BOT_TOKEN) {
    console.log('ℹ️  Customer bot token not configured (TELEGRAM_CUSTOMER_BOT_TOKEN)');
    return null;
  }

  try {
    customerBot = new TelegramBot(BOT_TOKEN, {
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    console.log('🤖 Customer Telegram bot started');
    
    // Load saved customer data
    loadCustomerData();
    
    // Setup command handlers
    setupCustomerCommands();
    
    return customerBot;
  } catch (error) {
    console.error('❌ Customer bot initialization error:', error);
    return null;
  }
};

/**
 * Setup customer bot commands
 */
const setupCustomerCommands = () => {
  // State for phone number input
  const pendingPhoneInput = {};

  // /start - Welcome message
  customerBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    const userName = msg.from.first_name || 'Mijoz';
    
    // Check if customer already registered
    if (customerData[chatIdStr]) {
      const customer = await Customer.findById(customerData[chatIdStr].customerId);
      if (customer) {
        const debts = await getCustomerDebts(customer._id);
        await sendDebtInfo(chatId, customer, debts);
        return;
      }
    }
    
    // New customer - ask for phone
    pendingPhoneInput[chatIdStr] = true;
    
    // Try with ReplyKeyboardMarkup first
    try {
      await customerBot.sendMessage(chatId,
        `👋 Assalomu alaykum, ${userName}!\n\n` +
        `🏪 *Universal Savdo Markazi* ga xush kelibsiz!\n\n` +
        `Qarz ma'lumotlaringizni ko'rish uchun telefon raqamingizni yuboring.\n\n` +
        `📱 *Telefon yuborish:*\n` +
        `Telefon raqamingizni yozing, masalan:\n` +
        `• \`998901234567\`\n` +
        `• \`+998901234567\`\n` +
        `• \`901234567\`\n\n` +
        `_Bekor qilish: /cancel_`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [
                {
                  text: '📱 Telefon raqamni yuborish',
                  request_contact: true
                }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
    } catch (error) {
      console.error('Error sending keyboard:', error);
      // Fallback without keyboard
      await customerBot.sendMessage(chatId,
        `👋 Assalomu alaykum, ${userName}!\n\n` +
        `🏪 *Universal Savdo Markazi* ga xush kelibsiz!\n\n` +
        `Qarz ma'lumotlaringizni ko'rish uchun telefon raqamingizni yuboring.\n\n` +
        `📱 *Format:*\n` +
        `• \`998901234567\`\n` +
        `• \`+998901234567\`\n` +
        `• \`901234567\`\n\n` +
        `_Bekor qilish: /cancel_`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // /cancel - Cancel phone input
  customerBot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    
    if (pendingPhoneInput[chatIdStr]) {
      delete pendingPhoneInput[chatIdStr];
      await customerBot.sendMessage(chatId, '❌ Bekor qilindi.', {
        reply_markup: { remove_keyboard: true }
      });
    }
  });

  // /help - Help message
  customerBot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpText = `📋 *Yordam*\n\n` +
      `*Mavjud buyruqlar:*\n` +
      `/start - Boshlash / Qarzni tekshirish\n` +
      `/help - Yordam\n` +
      `/mydebt - Mening qarzim\n` +
      `/contact - Bog'lanish\n\n` +
      `*Qanday ishlaydi?*\n` +
      `1. /start bosing\n` +
      `2. Telefon raqamingizni yuboring\n` +
      `3. Qarz ma'lumotlaringizni ko'ring\n\n` +
      `🏪 Universal Savdo Markazi`;

    await customerBot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  });

  // /mydebt - Check debt
  customerBot.onText(/\/mydebt/, async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    
    if (!customerData[chatIdStr]) {
      await customerBot.sendMessage(chatId,
        `⚠️ Siz ro'yxatdan o'tmagansiz.\n\n` +
        `Ro'yxatdan o'tish uchun /start bosing.`
      );
      return;
    }
    
    try {
      const customer = await Customer.findById(customerData[chatIdStr].customerId);
      if (!customer) {
        await customerBot.sendMessage(chatId, '❌ Mijoz topilmadi.');
        return;
      }
      
      const debts = await getCustomerDebts(customer._id);
      await sendDebtInfo(chatId, customer, debts);
    } catch (error) {
      console.error('Error checking debt:', error);
      await customerBot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  });

  // /contact - Contact information
  customerBot.onText(/\/contact/, async (msg) => {
    const chatId = msg.chat.id;
    
    const contactText = `📞 *Bog'lanish*\n\n` +
      `🏪 *Universal Savdo Markazi*\n\n` +
      `📱 Telefon: +998 90 123 45 67\n` +
      `📧 Email: info@universalbozor.uz\n` +
      `🌐 Website: universalbozor.uz\n` +
      `📍 Manzil: Toshkent shahar\n\n` +
      `⏰ Ish vaqti: 9:00 - 20:00`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📞 Qo\'ng\'iroq qilish', url: 'tel:+998901234567' }
        ],
        [
          { text: '🌐 Websaytga o\'tish', url: 'https://universalbozor.uz' }
        ]
      ]
    };

    await customerBot.sendMessage(chatId, contactText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  });

  // Handle callback queries
  customerBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const chatIdStr = chatId.toString();
    const data = query.data;

    await customerBot.answerCallbackQuery(query.id);

    if (data === 'refresh_debt') {
      if (!customerData[chatIdStr]) {
        await customerBot.sendMessage(chatId, '⚠️ Siz ro\'yxatdan o\'tmagansiz.');
        return;
      }
      
      try {
        const customer = await Customer.findById(customerData[chatIdStr].customerId);
        if (!customer) {
          await customerBot.sendMessage(chatId, '❌ Mijoz topilmadi.');
          return;
        }
        
        await customerBot.sendMessage(chatId, '🔄 Yangilanmoqda...');
        const debts = await getCustomerDebts(customer._id);
        await sendDebtInfo(chatId, customer, debts);
      } catch (error) {
        console.error('Error refreshing debt:', error);
        await customerBot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
      }
    } else if (data === 'show_stats') {
      if (!customerData[chatIdStr]) {
        await customerBot.sendMessage(chatId, '⚠️ Siz ro\'yxatdan o\'tmagansiz.');
        return;
      }
      
      try {
        await sendDetailedStats(chatId, customerData[chatIdStr].customerId);
      } catch (error) {
        console.error('Error showing stats:', error);
        await customerBot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
      }
    }
  });

  // Handle contact (phone number shared via button)
  customerBot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    const contact = msg.contact;
    
    // Check if waiting for phone input
    if (!pendingPhoneInput[chatIdStr]) return;
    
    // Get phone number from contact
    const phoneNumber = contact.phone_number;
    
    // Remove keyboard and show searching message
    await customerBot.sendMessage(chatId, '🔍 Qidirilmoqda...', {
      reply_markup: { remove_keyboard: true }
    });
    
    try {
      const customer = await findCustomerByPhone(phoneNumber);
      
      if (!customer) {
        await customerBot.sendMessage(chatId,
          `❌ *Mijoz topilmadi*\n\n` +
          `Bu telefon raqami bilan ro'yxatdan o'tgan mijoz topilmadi.\n\n` +
          `📱 Raqam: \`${phoneNumber}\`\n\n` +
          `*Iltimos:*\n` +
          `• Saytda ro'yxatdan o'tganingizni tekshiring\n` +
          `• Admin bilan bog'laning: /contact\n\n` +
          `Qaytadan urinish: /start`,
          { parse_mode: 'Markdown' }
        );
        delete pendingPhoneInput[chatIdStr];
        return;
      }
      
      // Save customer data
      customerData[chatIdStr] = {
        phone: customer.phone,
        customerId: customer._id.toString(),
        name: customer.name
      };
      saveCustomerData();
      delete pendingPhoneInput[chatIdStr];
      
      // Get and send debt info
      const debts = await getCustomerDebts(customer._id);
      await sendDebtInfo(chatId, customer, debts);
      
    } catch (error) {
      console.error('Error processing contact:', error);
      await customerBot.sendMessage(chatId,
        `❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.\n\n` +
        `Yordam: /help`
      );
      delete pendingPhoneInput[chatIdStr];
    }
  });

  // Handle text messages (phone number input)
  customerBot.on('message', async (msg) => {
    // Skip if it's a command or contact
    if (!msg.text || msg.text.startsWith('/') || msg.contact) return;
    
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    const text = msg.text.trim();
    
    // Check if waiting for phone input
    if (!pendingPhoneInput[chatIdStr]) return;
    
    // Handle "Bekor qilish" button
    if (text === '❌ Bekor qilish' || text.toLowerCase() === 'bekor qilish') {
      delete pendingPhoneInput[chatIdStr];
      await customerBot.sendMessage(chatId, '❌ Bekor qilindi.', {
        reply_markup: { remove_keyboard: true }
      });
      return;
    }
    
    // Validate phone format
    const phoneRegex = /^(\+?998)?[0-9]{9}$/;
    const cleanText = text.replace(/\s/g, '').replace(/-/g, '');
    
    if (!phoneRegex.test(cleanText)) {
      await customerBot.sendMessage(chatId,
        `⚠️ *Noto'g'ri format!*\n\n` +
        `Iltimos, telefon raqamini to'g'ri formatda kiriting:\n\n` +
        `📱 *To'g'ri:*\n` +
        `• \`998901234567\`\n` +
        `• \`+998901234567\`\n` +
        `• \`901234567\`\n\n` +
        `❌ *Noto'g'ri:*\n` +
        `• \`90 123 45 67\` (bo'sh joy)\n` +
        `• \`123456\` (kam raqam)\n\n` +
        `Qaytadan kiriting:`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Remove keyboard and search for customer
    await customerBot.sendMessage(chatId, '🔍 Qidirilmoqda...', {
      reply_markup: { remove_keyboard: true }
    });
    
    try {
      const customer = await findCustomerByPhone(cleanText);
      
      if (!customer) {
        await customerBot.sendMessage(chatId,
          `❌ *Mijoz topilmadi*\n\n` +
          `Bu telefon raqami bilan ro'yxatdan o'tgan mijoz topilmadi.\n\n` +
          `📱 Kiritilgan: \`${text}\`\n` +
          `🔍 Qidirilgan: \`${cleanText}\`\n\n` +
          `*Iltimos:*\n` +
          `• Saytda ro'yxatdan o'tganingizni tekshiring\n` +
          `• Raqamni to'g'ri kiritganingizni tekshiring\n` +
          `• Admin bilan bog'laning: /contact\n\n` +
          `Qaytadan urinish: /start`,
          { parse_mode: 'Markdown' }
        );
        delete pendingPhoneInput[chatIdStr];
        return;
      }
      
      // Save customer data
      customerData[chatIdStr] = {
        phone: customer.phone,
        customerId: customer._id.toString(),
        name: customer.name
      };
      saveCustomerData();
      delete pendingPhoneInput[chatIdStr];
      
      // Get and send debt info
      const debts = await getCustomerDebts(customer._id);
      await sendDebtInfo(chatId, customer, debts);
      
    } catch (error) {
      console.error('Error processing phone:', error);
      await customerBot.sendMessage(chatId,
        `❌ Xatolik yuz berdi. Qaytadan urinib ko'ring: /start\n\n` +
        `Yordam: /help`
      );
      delete pendingPhoneInput[chatIdStr];
    }
  });

  // Handle errors
  customerBot.on('polling_error', (error) => {
    if (error.code === 'EFATAL') {
      console.error('Customer bot connection error, will retry...');
    }
  });

  customerBot.on('error', (error) => {
    console.error('Customer bot error:', error.message);
  });
};

/**
 * Send debt notification to customer
 */
const sendDebtNotification = async (customerId, message) => {
  if (!customerBot) return false;
  
  // Find customer's chat ID
  const customerEntry = Object.entries(customerData).find(
    ([chatId, data]) => data.customerId === customerId.toString()
  );
  
  if (!customerEntry) {
    console.log(`Customer ${customerId} not registered in bot`);
    return false;
  }
  
  const [chatId] = customerEntry;
  
  try {
    await customerBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error(`Error sending notification to customer ${customerId}:`, error.message);
    return false;
  }
};

/**
 * Send debt reminder to all customers with debts
 */
const sendDebtReminders = async () => {
  if (!customerBot) return;
  
  try {
    // Get all customers with active debts
    const debts = await Debt.find({
      type: 'receivable',
      status: { $in: ['pending', 'overdue'] }
    }).populate('customer');
    
    // Group by customer
    const customerDebts = {};
    debts.forEach(debt => {
      if (!debt.customer) return;
      const customerId = debt.customer._id.toString();
      if (!customerDebts[customerId]) {
        customerDebts[customerId] = {
          customer: debt.customer,
          debts: []
        };
      }
      customerDebts[customerId].debts.push(debt);
    });
    
    // Send reminders
    let sent = 0;
    for (const [customerId, data] of Object.entries(customerDebts)) {
      const { customer, debts } = data;
      
      // Get customer stats
      const stats = await getCustomerStats(customerId);
      if (!stats) continue;
      
      // Calculate overdue debts
      const overdueDebts = debts.filter(d => new Date(d.dueDate) < new Date());
      
      let message = `⏰ *Qarz eslatmasi*\n\n`;
      message += `Hurmatli ${customer.name},\n\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💰 *Sizning qarz ma'lumotlaringiz:*\n\n`;
      message += `📋 Jami qarz: *${formatNumber(stats.totalDebt)} so'm*\n`;
      message += `✅ To'langan: *${formatNumber(stats.totalPaid)} so'm*\n`;
      message += `⏳ Qolgan: *${formatNumber(stats.remainingDebt)} so'm*\n\n`;
      
      if (overdueDebts.length > 0) {
        message += `🔴 *Muddati o'tgan qarzlar: ${overdueDebts.length} ta*\n\n`;
      }
      
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Iltimos, qarzingizni to'lashni unutmang.\n\n`;
      message += `Batafsil ma'lumot: /mydebt\n\n`;
      message += `🏪 Universal Savdo Markazi`;
      
      const success = await sendDebtNotification(customerId, message);
      if (success) sent++;
    }
    
    console.log(`📨 Sent ${sent} debt reminders to customers`);
    return sent;
  } catch (error) {
    console.error('Error sending debt reminders:', error);
    return 0;
  }
};

/**
 * Send sale notification to customer
 */
const sendSaleNotification = async (customerId, amount) => {
  console.log(`📨 Attempting to send sale notification to customer ${customerId} for ${amount} so'm`);
  
  if (!customerBot) {
    console.log('❌ Customer bot not initialized - check TELEGRAM_CUSTOMER_BOT_TOKEN in .env');
    return false;
  }
  
  // Find customer's chat ID
  const customerEntry = Object.entries(customerData).find(
    ([chatId, data]) => data.customerId === customerId.toString()
  );
  
  if (!customerEntry) {
    console.log(`⚠️ Customer ${customerId} not registered in bot - they need to /start the bot first`);
    return false;
  }
  
  const [chatId] = customerEntry;
  console.log(`📱 Found customer chat ID: ${chatId}`);
  
  try {
    let message = `🎉 *Xarid qildingiz!*\n\n`;
    message += `💰 Summa: *${formatNumber(amount)} so'm*\n`;
    message += `📅 Sana: ${new Date().toLocaleString('uz-UZ')}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Xaridingiz uchun rahmat! 🙏\n\n`;
    message += `🏪 *Universal Savdo Markazi*`;
    
    await customerBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`✅ Sale notification sent successfully to customer ${customerId}: ${formatNumber(amount)} so'm`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending sale notification to customer ${customerId}:`, error.message);
    return false;
  }
};

module.exports = {
  initCustomerBot,
  sendDebtNotification,
  sendSaleNotification,
  sendDebtReminders
};
