// Telegram Bot - Main bot initialization and commands
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const scheduler = require('./scheduler');
const Customer = require('../models/Customer');
const Debt = require('../models/Debt');

let bot = null;

// User roles: owner, admin, user
// owner - полный доступ, может назначать админов
// admin - может добавлять/удалять пользователей
// user - только получает статистику

let users = {}; // { chatId: { role: 'owner'|'admin'|'user', name: string, addedBy: string } }
let ownerId = null; // Первый кто нажал /start становится owner

// File to persist users
const usersFile = path.join(__dirname, '../../.telegram_users.json');

/**
 * Load saved users from file
 */
const loadUsers = () => {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8');
      const parsed = JSON.parse(data);
      users = parsed.users || {};
      ownerId = parsed.ownerId || null;
      return;
    }
    // Migration from old format
    const oldFile = path.join(__dirname, '../../.telegram_chat_ids');
    if (fs.existsSync(oldFile)) {
      const data = fs.readFileSync(oldFile, 'utf8');
      const ids = data.trim().split('\n').filter(id => id);
      if (ids.length > 0) {
        ownerId = ids[0];
        ids.forEach((id, index) => {
          users[id] = { 
            role: index === 0 ? 'owner' : 'user', 
            name: 'Migrated User',
            addedBy: index === 0 ? 'system' : ownerId
          };
        });
        saveUsers();
      }
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
};

/**
 * Save users to file
 */
const saveUsers = () => {
  try {
    fs.writeFileSync(usersFile, JSON.stringify({ ownerId, users }, null, 2));
    console.log(`💾 Users saved: ${Object.keys(users).length} users`);
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

/**
 * Get user role
 */
const getUserRole = (chatId) => {
  const id = chatId.toString();
  return users[id]?.role || null;
};

/**
 * Check if user can manage others
 */
const canManageUsers = (chatId) => {
  const role = getUserRole(chatId);
  return role === 'owner' || role === 'admin';
};

/**
 * Check if user is owner
 */
const isOwner = (chatId) => {
  return chatId.toString() === ownerId;
};

/**
 * Get all chat IDs (for sending reports)
 */
const getAllChatIds = () => {
  return Object.keys(users);
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
    console.log('🔍 Original phone:', phone);
    
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('🧹 Clean phone (digits only):', cleanPhone);
    
    // Get last 9 digits (actual phone number without country code)
    const last9 = cleanPhone.substring(cleanPhone.length - 9);
    console.log('📱 Last 9 digits:', last9);
    
    // Search using regex - match any format that contains these 9 digits
    // This will match: +998934268607, 998934268607, 934268607, +998 (93) 426-86-07, etc.
    const customer = await Customer.findOne({
      phone: { $regex: last9.split('').join('[^0-9]*'), $options: 'i' }
    });
    
    if (customer) {
      console.log('✅ Customer found:', customer.name, 'Phone in DB:', customer.phone);
      return customer;
    }
    
    console.log('❌ Customer not found with regex. Trying exact patterns...');
    
    // Fallback: Try exact patterns
    const searchPatterns = [
      phone,                          // Original: +998934268607
      cleanPhone,                     // Clean: 998934268607
      last9,                          // Last 9: 934268607
      '0' + last9,                    // With 0: 0934268607
      '998' + last9,                  // With 998: 998934268607
      '+998' + last9,                 // With +998: +998934268607
      '+' + cleanPhone,               // With +: +998934268607
      `+998 (${last9.substring(0,2)}) ${last9.substring(2,5)}-${last9.substring(5,7)}-${last9.substring(7,9)}` // +998 (93) 426-86-07
    ];
    
    console.log('🔎 Search patterns:', searchPatterns);
    
    const customer2 = await Customer.findOne({
      phone: { $in: searchPatterns }
    });
    
    if (customer2) {
      console.log('✅ Customer found with pattern:', customer2.name, 'Phone in DB:', customer2.phone);
      return customer2;
    }
    
    console.log('❌ Customer not found. Checking all customers...');
    // Debug: show all customers
    const allCustomers = await Customer.find({}).limit(10);
    console.log('📋 All customers:', allCustomers.map(c => ({ name: c.name, phone: c.phone })));
    
    return null;
  } catch (error) {
    console.error('❌ Error finding customer:', error);
    return null;
  }
};

/**
 * Get customer debts
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
    let totalDebt = 0;
    let totalPaid = 0;
    let remainingDebt = 0;
    
    debts.forEach(debt => {
      totalDebt += debt.amount;
      totalPaid += debt.paidAmount;
      
      if (debt.status === 'pending' || debt.status === 'overdue') {
        remainingDebt += (debt.amount - debt.paidAmount);
      }
    });
    
    return {
      totalPurchases: customer.totalPurchases || 0,
      totalDebt,
      totalPaid,
      remainingDebt,
      activeDebtsCount: debts.filter(d => d.status === 'pending' || d.status === 'overdue').length,
      paidDebtsCount: debts.filter(d => d.status === 'paid').length
    };
  } catch (error) {
    console.error('Error getting customer stats:', error);
    return null;
  }
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
 * Send debt information to customer
 */
const sendCustomerDebtInfo = async (chatId, customer, debts) => {
  const stats = await getCustomerStats(customer._id);
  
  if (!stats) {
    await bot.sendMessage(chatId, '❌ Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    return;
  }
  
  const activeDebts = debts.filter(d => d.status === 'pending' || d.status === 'overdue');
  
  let message = `📊 *Hisobot - ${customer.name}*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `💰 *Moliyaviy Ma'lumotlar:*\n\n`;
  message += `🛒 Jami xaridlar: *${formatNumber(stats.totalPurchases)} so'm*\n`;
  message += `📋 Jami qarz: *${formatNumber(stats.totalDebt)} so'm*\n`;
  message += `✅ To'langan: *${formatNumber(stats.totalPaid)} so'm*\n`;
  message += `⏳ Qolgan qarz: *${formatNumber(stats.remainingDebt)} so'm*\n\n`;
  
  if (stats.totalDebt > 0) {
    const paymentPercent = Math.round((stats.totalPaid / stats.totalDebt) * 100);
    const progressBar = generateProgressBar(paymentPercent);
    message += `📈 To'lov jarayoni: ${progressBar} ${paymentPercent}%\n\n`;
  }
  
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (stats.remainingDebt === 0) {
    message += `✅ *Ajoyib!*\n\n`;
    message += `Sizda hech qanday qarz yo'q.\n`;
    message += `Barcha qarzlaringiz to'langan! 🎉\n\n`;
    
    if (stats.paidDebtsCount > 0) {
      message += `📜 To'langan qarzlar: ${stats.paidDebtsCount} ta\n`;
    }
    
    message += `\nXaridlaringiz uchun rahmat! 🙏`;
  } else {
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
        { text: '🔄 Yangilash', callback_data: 'customer_refresh' }
      ]
    ]
  };

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};


// State for adding users
const pendingActions = {}; // { chatId: { action: 'add_user'|'add_admin'|'remove_user', step: number } }

// State for customer phone input
const pendingCustomerPhone = {}; // { chatId: true }

// Customer data storage
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
      console.log(`👥 Loaded ${Object.keys(customerData).length} customer(s) from bot`);
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
    console.log(`💾 Customer data saved: ${Object.keys(customerData).length} customer(s)`);
  } catch (error) {
    console.error('Error saving customer data:', error);
  }
};

/**
 * Initialize the Telegram bot
 */
const initBot = () => {
  if (!config.BOT_TOKEN) {
    console.error('❌ Telegram: BOT_TOKEN not configured');
    return null;
  }

  try {
    bot = new TelegramBot(config.BOT_TOKEN, { 
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    console.log('🤖 Telegram bot started');

    // Load saved users
    loadUsers();
    const userCount = Object.keys(users).length;
    if (userCount > 0) {
      console.log(`📱 Loaded ${userCount} user(s), owner: ${ownerId}`);
    }

    // Load saved customer data
    loadCustomerData();

    // Setup command handlers
    setupCommands();

    // Initialize scheduler
    scheduler.init(bot, ownerId, getAllChatIds);

    return bot;
  } catch (error) {
    console.error('❌ Telegram bot initialization error:', error);
    return null;
  }
};

/**
 * Send main menu
 */
const sendMainMenu = async (chatId) => {
  const role = getUserRole(chatId);
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 Bugungi hisobot', callback_data: 'report_today' },
        { text: '📈 Haftalik hisobot', callback_data: 'report_week' }
      ],
      [
        { text: '💰 Qarzlar', callback_data: 'report_debts' },
        { text: '📋 Bot holati', callback_data: 'status' }
      ]
    ]
  };

  // Add management buttons for owner and admin
  if (role === 'owner' || role === 'admin') {
    keyboard.inline_keyboard.push([
      { text: '👥 Foydalanuvchilar', callback_data: 'manage_users' }
    ]);
  }

  const roleEmoji = role === 'owner' ? '👑' : role === 'admin' ? '⭐' : '👤';
  const roleName = role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'User';

  await bot.sendMessage(chatId, 
    `🏠 *Asosiy menyu*\n\n${roleEmoji} Sizning rolingiz: *${roleName}*\n\nQuyidagi tugmalardan birini tanlang:`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
};

/**
 * Send user management menu
 */
const sendUserManagementMenu = async (chatId) => {
  const role = getUserRole(chatId);
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '➕ Foydalanuvchi qo\'shish', callback_data: 'add_user' }
      ],
      [
        { text: '➖ Foydalanuvchini o\'chirish', callback_data: 'remove_user' }
      ],
      [
        { text: '📋 Ro\'yxatni ko\'rish', callback_data: 'list_users' }
      ]
    ]
  };

  // Only owner can add/remove admins
  if (role === 'owner') {
    keyboard.inline_keyboard.splice(1, 0, [
      { text: '⭐ Admin qo\'shish', callback_data: 'add_admin' }
    ]);
  }

  keyboard.inline_keyboard.push([
    { text: '🔙 Orqaga', callback_data: 'main_menu' }
  ]);

  await bot.sendMessage(chatId,
    `👥 *Foydalanuvchilarni boshqarish*\n\nKerakli amalni tanlang:`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
};

/**
 * Send users list
 */
const sendUsersList = async (chatId) => {
  const userList = Object.entries(users).map(([id, data]) => {
    const emoji = data.role === 'owner' ? '👑' : data.role === 'admin' ? '⭐' : '👤';
    return `${emoji} \`${id}\` - ${data.name || 'Nomsiz'}`;
  }).join('\n');

  const keyboard = {
    inline_keyboard: [
      [{ text: '🔙 Orqaga', callback_data: 'manage_users' }]
    ]
  };

  await bot.sendMessage(chatId,
    `📋 *Foydalanuvchilar ro'yxati (${Object.keys(users).length}):*\n\n` +
    `👑 Owner | ⭐ Admin | 👤 User\n\n${userList || 'Ro\'yxat bo\'sh'}`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
};


/**
 * Setup bot commands
 */
const setupCommands = () => {
  // /start - Register or show menu
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    const userName = msg.from.first_name || msg.from.username || 'User';
    
    // If no owner yet, first user becomes owner
    if (!ownerId) {
      ownerId = chatIdStr;
      users[chatIdStr] = { role: 'owner', name: userName, addedBy: 'system' };
      saveUsers();
      scheduler.updateAdminChatId(ownerId);
      
      await bot.sendMessage(chatId,
        `👑 *Tabriklaymiz!*\n\n` +
        `Siz bot egasi (owner) sifatida ro'yxatdan o'tdingiz!\n\n` +
        `🆔 Sizning ID: \`${chatId}\`\n\n` +
        `Siz boshqa foydalanuvchilar va adminlarni qo'shishingiz mumkin.`,
        { parse_mode: 'Markdown' }
      );
      await sendMainMenu(chatId);
      return;
    }
    
    // Check if user is admin
    if (users[chatIdStr]) {
      await sendMainMenu(chatId);
      return;
    }
    
    // Check if customer already registered
    if (customerData[chatIdStr]) {
      try {
        const customer = await Customer.findById(customerData[chatIdStr].customerId);
        if (customer) {
          const debts = await getCustomerDebts(customer._id);
          await sendCustomerDebtInfo(chatId, customer, debts);
          return;
        } else {
          // Customer deleted from database, remove from bot data
          delete customerData[chatIdStr];
          saveCustomerData();
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    }
    
    // New customer - ask for phone
    pendingCustomerPhone[chatIdStr] = true;
    
    await bot.sendMessage(chatId,
      `👋 Assalomu alaykum, ${userName}!\n\n` +
      `🏪 *Universal Savdo Markazi* ga xush kelibsiz!\n\n` +
      `Qarz ma'lumotlaringizni ko'rish uchun telefon raqamingizni yuboring.\n\n` +
      `📱 *Telefon yuborish:*\n` +
      `Quyidagi tugmani bosing yoki raqamni yozing:\n` +
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
  });

  // /menu - Show main menu
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    if (!users[chatId.toString()]) {
      await bot.sendMessage(chatId, '⛔ Siz ro\'yxatda yo\'qsiz.');
      return;
    }
    await sendMainMenu(chatId);
  });

  // /help - Show available commands
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const helpText = `📋 *Mavjud buyruqlar:*\n\n` +
      `/start - Boshlash / Menyu\n` +
      `/menu - Asosiy menyu\n` +
      `/help - Yordam\n` +
      `/today - Bugungi hisobot\n` +
      `/week - Haftalik hisobot\n` +
      `/debts - Qarzlar\n` +
      `/status - Bot holati`;

    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  });

  // /today - Daily report
  bot.onText(/\/today/, async (msg) => {
    const chatId = msg.chat.id;
    if (!users[chatId.toString()]) {
      await bot.sendMessage(chatId, '⛔ Siz ro\'yxatda yo\'qsiz.');
      return;
    }
    await bot.sendMessage(chatId, '⏳ Hisobot tayyorlanmoqda...');
    await scheduler.triggerDailyReport();
  });

  // /week - Weekly report
  bot.onText(/\/week/, async (msg) => {
    const chatId = msg.chat.id;
    if (!users[chatId.toString()]) {
      await bot.sendMessage(chatId, '⛔ Siz ro\'yxatda yo\'qsiz.');
      return;
    }
    await bot.sendMessage(chatId, '⏳ Haftalik hisobot tayyorlanmoqda...');
    await scheduler.triggerWeeklyReport();
  });

  // /debts - Debt check
  bot.onText(/\/debts/, async (msg) => {
    const chatId = msg.chat.id;
    if (!users[chatId.toString()]) {
      await bot.sendMessage(chatId, '⛔ Siz ro\'yxatda yo\'qsiz.');
      return;
    }
    await bot.sendMessage(chatId, '🔍 Qarzlar tekshirilmoqda...');
    await scheduler.triggerDebtCheck();
  });

  // /status - Bot status
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    const ownerCount = Object.values(users).filter(u => u.role === 'owner').length;
    const adminCount = Object.values(users).filter(u => u.role === 'admin').length;
    const userCount = Object.values(users).filter(u => u.role === 'user').length;
    
    const statusText = `🤖 *Bot holati*\n\n` +
      `✅ Bot ishlayapti\n\n` +
      `👥 *Foydalanuvchilar:*\n` +
      `👑 Owner: ${ownerCount}\n` +
      `⭐ Adminlar: ${adminCount}\n` +
      `👤 Userlar: ${userCount}\n\n` +
      `⏰ Server vaqti:\n${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n\n` +
      `*Jadval:*\n` +
      `• Qarz eslatmalari: 09:00\n` +
      `• Kunlik hisobot: 23:00\n` +
      `• Haftalik: Dushanba 10:00`;

    await bot.sendMessage(chatId, statusText, { parse_mode: 'Markdown' });
  });

  // Handle callback queries (button clicks)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const chatIdStr = chatId.toString();

    await bot.answerCallbackQuery(query.id);

    // Customer actions don't need registration check
    if (data === 'customer_refresh') {
      // Handle customer refresh
      await bot.sendMessage(chatId, '🔄 Yangilanmoqda...');
      pendingCustomerPhone[chatIdStr] = true;
      await bot.sendMessage(chatId,
        `📱 Telefon raqamingizni qayta yuboring:`,
        { 
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
      return;
    }

    // Check if user is registered (only for admin actions)
    if (!users[chatIdStr] && data !== 'main_menu') {
      await bot.sendMessage(chatId, '⛔ Siz ro\'yxatda yo\'qsiz.');
      return;
    }

    const role = getUserRole(chatId);

    switch (data) {
      case 'main_menu':
        await sendMainMenu(chatId);
        break;

      case 'report_today':
        await bot.sendMessage(chatId, '⏳ Hisobot tayyorlanmoqda...');
        await scheduler.triggerDailyReport();
        break;

      case 'report_week':
        await bot.sendMessage(chatId, '⏳ Haftalik hisobot tayyorlanmoqda...');
        await scheduler.triggerWeeklyReport();
        break;

      case 'report_debts':
        await bot.sendMessage(chatId, '🔍 Qarzlar tekshirilmoqda...');
        await scheduler.triggerDebtCheck();
        break;

      case 'status':
        bot.emit('text', { chat: { id: chatId }, text: '/status', from: query.from });
        break;

      case 'manage_users':
        if (!canManageUsers(chatId)) {
          await bot.sendMessage(chatId, '⛔ Sizda ruxsat yo\'q.');
          return;
        }
        await sendUserManagementMenu(chatId);
        break;

      case 'list_users':
        await sendUsersList(chatId);
        break;

      case 'add_user':
        if (!canManageUsers(chatId)) {
          await bot.sendMessage(chatId, '⛔ Sizda ruxsat yo\'q.');
          return;
        }
        pendingActions[chatIdStr] = { action: 'add_user' };
        await bot.sendMessage(chatId,
          `➕ *Foydalanuvchi qo'shish*\n\n` +
          `Yangi foydalanuvchining Telegram ID raqamini yuboring:\n\n` +
          `_Bekor qilish uchun /cancel_`,
          { parse_mode: 'Markdown' }
        );
        break;

      case 'add_admin':
        if (!isOwner(chatId)) {
          await bot.sendMessage(chatId, '⛔ Faqat owner admin qo\'sha oladi.');
          return;
        }
        pendingActions[chatIdStr] = { action: 'add_admin' };
        await bot.sendMessage(chatId,
          `⭐ *Admin qo'shish*\n\n` +
          `Yangi adminning Telegram ID raqamini yuboring:\n\n` +
          `_Bekor qilish uchun /cancel_`,
          { parse_mode: 'Markdown' }
        );
        break;

      case 'remove_user':
        if (!canManageUsers(chatId)) {
          await bot.sendMessage(chatId, '⛔ Sizda ruxsat yo\'q.');
          return;
        }
        pendingActions[chatIdStr] = { action: 'remove_user' };
        await bot.sendMessage(chatId,
          `➖ *Foydalanuvchini o'chirish*\n\n` +
          `O'chiriladigan foydalanuvchining Telegram ID raqamini yuboring:\n\n` +
          `_Bekor qilish uchun /cancel_`,
          { parse_mode: 'Markdown' }
        );
        break;
    }
  });


  // /cancel - Cancel pending action
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    
    if (pendingActions[chatIdStr]) {
      delete pendingActions[chatIdStr];
      await bot.sendMessage(chatId, '❌ Amal bekor qilindi.', {
        reply_markup: { remove_keyboard: true }
      });
      await sendMainMenu(chatId);
    } else if (pendingCustomerPhone[chatIdStr]) {
      delete pendingCustomerPhone[chatIdStr];
      await bot.sendMessage(chatId, '❌ Bekor qilindi.', {
        reply_markup: { remove_keyboard: true }
      });
    }
  });

  // Handle contact (phone number shared via button)
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    const contact = msg.contact;
    
    console.log('📱 Contact received:', contact);
    console.log('📋 Pending customer phone:', pendingCustomerPhone);
    
    // Check if waiting for phone input
    if (!pendingCustomerPhone[chatIdStr]) {
      console.log('⚠️ Not waiting for phone input from', chatIdStr);
      return;
    }
    
    const phoneNumber = contact.phone_number;
    console.log('🔍 Searching for phone:', phoneNumber);
    
    await bot.sendMessage(chatId, '🔍 Qidirilmoqda...', {
      reply_markup: { remove_keyboard: true }
    });
    
    try {
      const customer = await findCustomerByPhone(phoneNumber);
      console.log('👤 Customer found:', customer ? customer.name : 'NOT FOUND');
      
      if (!customer) {
        await bot.sendMessage(chatId,
          `❌ *Mijoz topilmadi*\n\n` +
          `Bu telefon raqami bilan ro'yxatdan o'tgan mijoz topilmadi.\n\n` +
          `📱 Raqam: \`${phoneNumber}\`\n\n` +
          `*Iltimos:*\n` +
          `• Saytda ro'yxatdan o'tganingizni tekshiring\n` +
          `• Admin bilan bog'laning\n\n` +
          `Qaytadan urinish: /start`,
          { parse_mode: 'Markdown' }
        );
        delete pendingCustomerPhone[chatIdStr];
        return;
      }
      
      delete pendingCustomerPhone[chatIdStr];
      
      // Save customer data
      customerData[chatIdStr] = {
        phone: customer.phone,
        customerId: customer._id.toString(),
        name: customer.name
      };
      saveCustomerData();
      
      const debts = await getCustomerDebts(customer._id);
      console.log('💰 Debts found:', debts.length);
      await sendCustomerDebtInfo(chatId, customer, debts);
      
    } catch (error) {
      console.error('❌ Error processing contact:', error);
      await bot.sendMessage(chatId,
        `❌ Xatolik yuz berdi. Qaytadan urinib ko'ring: /start`
      );
      delete pendingCustomerPhone[chatIdStr];
    }
  });

  // Handle text messages for pending actions
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/') || msg.contact) return;
    
    const chatId = msg.chat.id;
    const chatIdStr = chatId.toString();
    const text = msg.text.trim();
    
    // Handle customer phone input
    if (pendingCustomerPhone[chatIdStr]) {
      // Validate phone format
      const phoneRegex = /^(\+?998)?[0-9]{9}$/;
      const cleanText = text.replace(/\s/g, '').replace(/-/g, '');
      
      if (!phoneRegex.test(cleanText)) {
        await bot.sendMessage(chatId,
          `⚠️ *Noto'g'ri format!*\n\n` +
          `Iltimos, telefon raqamini to'g'ri formatda kiriting:\n\n` +
          `📱 *To'g'ri:*\n` +
          `• \`998901234567\`\n` +
          `• \`+998901234567\`\n` +
          `• \`901234567\`\n\n` +
          `Qaytadan kiriting:`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      await bot.sendMessage(chatId, '🔍 Qidirilmoqda...', {
        reply_markup: { remove_keyboard: true }
      });
      
      try {
        const customer = await findCustomerByPhone(cleanText);
        
        if (!customer) {
          await bot.sendMessage(chatId,
            `❌ *Mijoz topilmadi*\n\n` +
            `Bu telefon raqami bilan ro'yxatdan o'tgan mijoz topilmadi.\n\n` +
            `📱 Kiritilgan: \`${text}\`\n\n` +
            `*Iltimos:*\n` +
            `• Saytda ro'yxatdan o'tganingizni tekshiring\n` +
            `• Raqamni to'g'ri kiritganingizni tekshiring\n` +
            `• Admin bilan bog'laning\n\n` +
            `Qaytadan urinish: /start`,
            { parse_mode: 'Markdown' }
          );
          delete pendingCustomerPhone[chatIdStr];
          return;
        }
        
        delete pendingCustomerPhone[chatIdStr];
        
        // Save customer data
        customerData[chatIdStr] = {
          phone: customer.phone,
          customerId: customer._id.toString(),
          name: customer.name
        };
        saveCustomerData();
        
        const debts = await getCustomerDebts(customer._id);
        await sendCustomerDebtInfo(chatId, customer, debts);
        
      } catch (error) {
        console.error('Error processing phone:', error);
        await bot.sendMessage(chatId,
          `❌ Xatolik yuz berdi. Qaytadan urinib ko'ring: /start`
        );
        delete pendingCustomerPhone[chatIdStr];
      }
      return;
    }
    
    if (!pendingActions[chatIdStr]) return;
    
    const action = pendingActions[chatIdStr].action;
    const role = getUserRole(chatId);
    
    // Validate ID format
    if (!/^\d+$/.test(text)) {
      await bot.sendMessage(chatId, '⚠️ Noto\'g\'ri format. Faqat raqam kiriting.');
      return;
    }

    const targetId = text;
    
    switch (action) {
      case 'add_user':
        if (users[targetId]) {
          await bot.sendMessage(chatId, `⚠️ Bu foydalanuvchi allaqachon ro'yxatda.`);
        } else {
          users[targetId] = { 
            role: 'user', 
            name: 'User', 
            addedBy: chatIdStr 
          };
          saveUsers();
          await bot.sendMessage(chatId, 
            `✅ Foydalanuvchi qo'shildi!\n\n` +
            `🆔 ID: \`${targetId}\`\n` +
            `👤 Rol: User`,
            { parse_mode: 'Markdown' }
          );
          // Notify the new user
          try {
            await bot.sendMessage(targetId,
              `🎉 *Tabriklaymiz!*\n\n` +
              `Siz hisobotlar ro'yxatiga qo'shildingiz.\n` +
              `Menyuni ochish uchun /start bosing.`,
              { parse_mode: 'Markdown' }
            );
          } catch (e) {
            // User hasn't started the bot yet
          }
        }
        break;

      case 'add_admin':
        if (!isOwner(chatId)) {
          await bot.sendMessage(chatId, '⛔ Faqat owner admin qo\'sha oladi.');
          break;
        }
        if (users[targetId]?.role === 'owner') {
          await bot.sendMessage(chatId, `⚠️ Owner rolini o'zgartirish mumkin emas.`);
        } else {
          users[targetId] = { 
            role: 'admin', 
            name: users[targetId]?.name || 'Admin', 
            addedBy: chatIdStr 
          };
          saveUsers();
          await bot.sendMessage(chatId, 
            `✅ Admin qo'shildi!\n\n` +
            `🆔 ID: \`${targetId}\`\n` +
            `⭐ Rol: Admin`,
            { parse_mode: 'Markdown' }
          );
          // Notify the new admin
          try {
            await bot.sendMessage(targetId,
              `🎉 *Tabriklaymiz!*\n\n` +
              `Siz admin sifatida tayinlandingiz!\n` +
              `Endi siz foydalanuvchilarni qo'shish va o'chirish imkoniyatiga egasiz.\n` +
              `Menyuni ochish uchun /start bosing.`,
              { parse_mode: 'Markdown' }
            );
          } catch (e) {
            // User hasn't started the bot yet
          }
        }
        break;

      case 'remove_user':
        if (!users[targetId]) {
          await bot.sendMessage(chatId, `⚠️ Bu foydalanuvchi ro'yxatda yo'q.`);
        } else if (targetId === ownerId) {
          await bot.sendMessage(chatId, `⛔ Owner ni o'chirish mumkin emas.`);
        } else if (users[targetId].role === 'admin' && !isOwner(chatId)) {
          await bot.sendMessage(chatId, `⛔ Faqat owner adminni o'chira oladi.`);
        } else {
          const removedRole = users[targetId].role;
          delete users[targetId];
          saveUsers();
          await bot.sendMessage(chatId, 
            `✅ Foydalanuvchi o'chirildi!\n\n` +
            `🆔 ID: \`${targetId}\``,
            { parse_mode: 'Markdown' }
          );
          // Notify the removed user
          try {
            await bot.sendMessage(targetId,
              `❌ Siz hisobotlar ro'yxatidan chiqarildingiz.`,
              { parse_mode: 'Markdown' }
            );
          } catch (e) {
            // User blocked the bot
          }
        }
        break;
    }
    
    delete pendingActions[chatIdStr];
    await sendUserManagementMenu(chatId);
  });

  // Handle errors
  bot.on('polling_error', (error) => {
    if (error.code === 'EFATAL') {
      console.error('Telegram connection error, will retry...');
    }
  });

  bot.on('error', (error) => {
    console.error('Telegram error:', error.message);
  });
};

/**
 * Get bot instance
 */
const getBot = () => bot;

/**
 * Get all chat IDs (for backward compatibility)
 */
const getAdminChatIds = () => getAllChatIds();

/**
 * Send message to ALL users
 */
const sendToAllAdmins = async (message, options = {}) => {
  const chatIds = getAllChatIds();
  if (!bot || chatIds.length === 0) {
    console.log('⚠️ Cannot send message: bot or users not available');
    return false;
  }

  let success = 0;
  for (const chatId of chatIds) {
    try {
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...options
      });
      success++;
    } catch (error) {
      console.error(`Error sending to ${chatId}:`, error.message);
    }
  }
  
  return success > 0;
};

/**
 * Send message to admin (backward compatibility)
 */
const sendToAdmin = async (message, options = {}) => {
  return sendToAllAdmins(message, options);
};

/**
 * Send document to ALL users
 */
const sendDocumentToAllAdmins = async (filePath, caption = '') => {
  const chatIds = getAllChatIds();
  if (!bot || chatIds.length === 0) {
    console.log('⚠️ Cannot send document: bot or users not available');
    return false;
  }

  let success = 0;
  for (const chatId of chatIds) {
    try {
      await bot.sendDocument(chatId, filePath, {
        caption: caption,
        parse_mode: 'Markdown'
      });
      success++;
    } catch (error) {
      console.error(`Error sending document to ${chatId}:`, error.message);
    }
  }
  
  return success > 0;
};

/**
 * Send document to admin (backward compatibility)
 */
const sendDocumentToAdmin = async (filePath, caption = '') => {
  return sendDocumentToAllAdmins(filePath, caption);
};

/**
 * Check if user is admin (backward compatibility)
 */
const isAdmin = (chatId) => {
  return !!users[chatId.toString()];
};

/**
 * Add admin (backward compatibility)
 */
const addAdmin = (chatId) => {
  const id = chatId.toString();
  if (!users[id]) {
    users[id] = { role: 'user', name: 'User', addedBy: 'system' };
    saveUsers();
    return true;
  }
  return false;
};

/**
 * Remove admin (backward compatibility)
 */
const removeAdmin = (chatId) => {
  const id = chatId.toString();
  if (users[id] && id !== ownerId) {
    delete users[id];
    saveUsers();
    return true;
  }
  return false;
};

module.exports = {
  initBot,
  getBot,
  getAdminChatIds,
  sendToAdmin,
  sendToAllAdmins,
  sendDocumentToAdmin,
  sendDocumentToAllAdmins,
  isAdmin,
  addAdmin,
  removeAdmin,
  getAllChatIds,
  getUserRole,
  isOwner
};
