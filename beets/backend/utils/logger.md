# 📝 Logger - Logging Tizimi

## Maqsad

Winston kutubxonasi asosida yaratilgan markazlashtirilgan logging tizimi. Barcha server loglarini yozib borish va xatolarni kuzatish uchun ishlatiladi.

## Joylashuv

`server/src/utils/logger.js`

## Texnologiya

- **Winston**: Professional logging kutubxonasi
- **Log Levels**: error, warn, info, debug

## Funksiyalar

### logger.error(message, meta)
Xato xabarlarini yozadi.

**Parametrlar:**
- `message` (string): Xato xabari
- `meta` (object, optional): Qo'shimcha ma'lumotlar

**Misol:**
```javascript
logger.error('Database connection failed', { 
  error: err.message,
  database: 'mongodb'
});
```

### logger.warn(message, meta)
Ogohlantirish xabarlarini yozadi.

**Misol:**
```javascript
logger.warn('Unauthorized access attempt', {
  userId: req.user.id,
  path: req.path
});
```

### logger.info(message, meta)
Umumiy ma'lumot xabarlarini yozadi.

**Misol:**
```javascript
logger.info('Server started', { 
  port: 5050,
  env: 'production'
});
```

### logger.debug(message, meta)
Debug ma'lumotlarini yozadi (faqat development da).

**Misol:**
```javascript
logger.debug('User data loaded', { 
  userId: user.id,
  loadTime: '150ms'
});
```

## Konfiguratsiya

### Development
- Console ga chiqaradi
- Rangli format
- Debug level

### Production
- Console + faylga yozadi
- JSON format
- Info level
- Fayllar:
  - `logs/error.log` - Faqat xatolar
  - `logs/combined.log` - Barcha loglar
- Maksimal hajm: 5MB
- Maksimal fayllar: 5 ta

## Log Formati

### Console (Development)
```
14:30:45 [info]: Server started { port: 5050 }
14:30:46 [error]: Database error { message: "Connection timeout" }
```

### File (Production)
```json
{
  "timestamp": "2024-01-15 14:30:45",
  "level": "error",
  "message": "Database error",
  "service": "universal-uz-api",
  "error": "Connection timeout"
}
```

## Ishlatish

```javascript
const logger = require('./utils/logger');

// Oddiy xabar
logger.info('User logged in');

// Qo'shimcha ma'lumot bilan
logger.error('Payment failed', {
  userId: user.id,
  amount: 100000,
  error: err.message
});

// Xato stack bilan
logger.error('Unexpected error', {
  error: err.message,
  stack: err.stack
});
```

## Qachon Ishlatish

1. **Error**: Kritik xatolar, database xatolari, server xatolari
2. **Warn**: Ogohlantirish, ruxsatsiz kirish urinishlari
3. **Info**: Server start/stop, muhim operatsiyalar
4. **Debug**: Development da debug qilish uchun

## Muhim Eslatmalar

- Production da faqat `info` va yuqori darajadagi loglar yoziladi
- Parol va maxfiy ma'lumotlarni logga yozmaslik kerak
- Log fayllari avtomatik rotate qilinadi (5MB dan oshganda)
- Development da console ga, production da faylga yoziladi

## Bog'liq Modullar

- `config/index.js` - Konfiguratsiya
- `middleware/errorHandler.js` - Xatolarni log qilish

## Kelajakda Qo'shilishi Mumkin

- [ ] Log aggregation (ELK Stack)
- [ ] Real-time log monitoring
- [ ] Alert system (email/telegram)
- [ ] Log analytics dashboard
