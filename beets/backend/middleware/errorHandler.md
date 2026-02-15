# 🚨 Error Handler - Markazlashtirilgan Xatolarni Boshqarish

## Maqsad

Barcha xatolarni bir joyda handle qilish va standart formatda response qaytarish.

## Joylashuv

`server/src/middleware/errorHandler.js`

## Asosiy Funksiya

### errorHandler(err, req, res, next)

Express error handling middleware. Barcha xatolarni catch qilib, to'g'ri formatda qaytaradi.

**Parametrlar:**
- `err` (Error): Xato obyekti
- `req` (Request): Express request
- `res` (Response): Express response
- `next` (Function): Next middleware

## Qanday Ishlaydi

1. Xatoni log qiladi (Winston orqali)
2. Xato turini aniqlaydi
3. Tegishli HTTP status code ni belgilaydi
4. Standart formatda response qaytaradi

## Handle Qilinadigan Xatolar

### 1. Mongoose CastError
MongoDB ID formati noto'g'ri.

**Misol:**
```javascript
// Noto'g'ri ID
GET /api/products/invalid-id

// Response
{
  "success": false,
  "error": {
    "message": "Noto'g'ri ID formati",
    "code": "INVALID_ID"
  }
}
```

### 2. Mongoose Duplicate Key (11000)
Unique field takrorlanmoqda.

**Misol:**
```javascript
// Mavjud telefon raqam
POST /api/users
{
  "phone": "+998901234567" // Bu raqam allaqachon mavjud
}

// Response
{
  "success": false,
  "error": {
    "message": "phone \"+998901234567\" allaqachon mavjud",
    "code": "DUPLICATE_KEY"
  }
}
```

### 3. Mongoose ValidationError
Model validatsiyasi muvaffaqiyatsiz.

**Misol:**
```javascript
// Required field yo'q
POST /api/products
{
  "name": "Mahsulot"
  // price yo'q (required)
}

// Response
{
  "success": false,
  "error": {
    "message": "Validatsiya xatosi",
    "code": "VALIDATION_ERROR",
    "errors": [
      {
        "field": "price",
        "message": "Price is required"
      }
    ]
  }
}
```

### 4. JWT Errors
Token bilan bog'liq xatolar.

**JsonWebTokenError:**
```javascript
{
  "success": false,
  "error": {
    "message": "Token yaroqsiz",
    "code": "INVALID_TOKEN"
  }
}
```

**TokenExpiredError:**
```javascript
{
  "success": false,
  "error": {
    "message": "Token muddati tugagan",
    "code": "TOKEN_EXPIRED"
  }
}
```

### 5. Multer Errors
Fayl yuklash xatolari.

**LIMIT_FILE_SIZE:**
```javascript
{
  "success": false,
  "error": {
    "message": "Fayl hajmi juda katta",
    "code": "FILE_TOO_LARGE"
  }
}
```

### 6. Custom Errors
Bizning custom error classlarimiz.

```javascript
throw new NotFoundError('Mahsulot');

// Response
{
  "success": false,
  "error": {
    "message": "Mahsulot topilmadi",
    "code": "NOT_FOUND"
  }
}
```

## Ishlatish

### Express App da
```javascript
const express = require('express');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Error handler (oxirgi middleware)
app.use(errorHandler);
```

### Controller da
```javascript
const { asyncHandler } = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new NotFoundError('Mahsulot'); // errorHandler ga boradi
  }
  
  res.json({ success: true, data: product });
});
```

## Response Formati

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Xato xabari",
    "code": "ERROR_CODE"
  }
}
```

### Error Response (Validatsiya)
```json
{
  "success": false,
  "error": {
    "message": "Validatsiya xatosi",
    "code": "VALIDATION_ERROR",
    "errors": [
      { "field": "name", "message": "Ism kiritilmagan" },
      { "field": "price", "message": "Narx musbat bo'lishi kerak" }
    ]
  }
}
```

### Error Response (Development)
Development da stack trace ham qaytariladi:

```json
{
  "success": false,
  "error": {
    "message": "Xato xabari",
    "code": "ERROR_CODE",
    "stack": "Error: ...\n    at ..."
  }
}
```

## Logging

Har bir xato log qilinadi:

```javascript
logger.error('Error occurred:', {
  message: err.message,
  stack: err.stack,
  url: req.originalUrl,
  method: req.method,
  ip: req.ip,
  userId: req.user?.id
});
```

## Process Events

### Unhandled Promise Rejection
```javascript
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Production da server to'xtatiladi
});
```

### Uncaught Exception
```javascript
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1); // Server to'xtatiladi
});
```

## HTTP Status Codes

| Status | Ma'nosi | Qachon |
|--------|---------|--------|
| 400 | Bad Request | Validatsiya xatosi |
| 401 | Unauthorized | Token yo'q/yaroqsiz |
| 403 | Forbidden | Ruxsat yo'q |
| 404 | Not Found | Ma'lumot topilmadi |
| 409 | Conflict | Duplicate key |
| 500 | Internal Server Error | Server xatosi |

## Muhim Eslatmalar

1. Error handler har doim oxirgi middleware bo'lishi kerak
2. Custom errorlardan foydalaning
3. Maxfiy ma'lumotlarni xato xabarida ko'rsatmang
4. Production da stack trace ko'rsatmang
5. Barcha xatolarni log qiling

## Bog'liq Modullar

- `utils/errors.js` - Custom error classes
- `utils/logger.js` - Logging
- `utils/asyncHandler.js` - Async xatolarni catch qilish

## Best Practices

```javascript
// ✅ To'g'ri - Custom error
throw new NotFoundError('Mahsulot');

// ❌ Noto'g'ri - Oddiy error
throw new Error('Product not found');

// ✅ To'g'ri - Error handler oxirida
app.use('/api', routes);
app.use(errorHandler);

// ❌ Noto'g'ri - Error handler o'rtada
app.use(errorHandler);
app.use('/api', routes);

// ✅ To'g'ri - Xatoni log qilish
logger.error('Database error', { error: err.message });

// ❌ Noto'g'ri - Console.log
console.log('Error:', err);
```

## Testing

```javascript
const request = require('supertest');
const app = require('../app');

describe('Error Handler', () => {
  it('should handle 404 errors', async () => {
    const res = await request(app)
      .get('/api/products/invalid-id')
      .expect(404);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
  
  it('should handle validation errors', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test' }) // price yo'q
      .expect(400);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.errors).toBeDefined();
  });
});
```

## Frontend da Handle Qilish

```javascript
// Axios interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const errorData = error.response?.data?.error;
    
    // Error code ga qarab handle qilish
    switch (errorData?.code) {
      case 'AUTHENTICATION_ERROR':
      case 'TOKEN_EXPIRED':
        // Login ga yo'naltirish
        window.location.href = '/login';
        break;
        
      case 'VALIDATION_ERROR':
        // Validatsiya xatolarini ko'rsatish
        showValidationErrors(errorData.errors);
        break;
        
      case 'NOT_FOUND':
        // 404 sahifasini ko'rsatish
        showNotFoundPage();
        break;
        
      default:
        // Umumiy xato xabari
        showErrorToast(errorData?.message || 'Xato yuz berdi');
    }
    
    return Promise.reject(error);
  }
);
```
