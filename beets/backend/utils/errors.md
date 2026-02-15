# ⚠️ Custom Error Classes - Xatolarni Boshqarish

## Maqsad

Tizimda yuzaga keladigan barcha xatolarni standart formatda boshqarish. Har bir xato turi uchun alohida class yaratilgan.

## Joylashuv

`server/src/utils/errors.js`

## Error Classes

### 1. AppError (Asosiy Class)

Barcha custom errorlarning asosiy classi.

**Parametrlar:**
- `message` (string): Xato xabari
- `statusCode` (number): HTTP status code
- `errorCode` (string, optional): Xato kodi

**Misol:**
```javascript
throw new AppError('Xato yuz berdi', 500, 'CUSTOM_ERROR');
```

### 2. ValidationError

Ma'lumot validatsiya xatolari uchun.

**Parametrlar:**
- `message` (string): Xato xabari
- `errors` (array, optional): Validatsiya xatolari ro'yxati

**Misol:**
```javascript
throw new ValidationError('Validatsiya xatosi', [
  { field: 'name', message: 'Ism kiritilmagan' },
  { field: 'phone', message: 'Telefon noto\'g\'ri' }
]);
```

**HTTP Status:** 400 Bad Request

### 3. AuthenticationError

Autentifikatsiya xatolari uchun (login talab qilinadi).

**Misol:**
```javascript
throw new AuthenticationError('Token topilmadi');
throw new AuthenticationError(); // Default: "Avtorizatsiya talab qilinadi"
```

**HTTP Status:** 401 Unauthorized

### 4. AuthorizationError

Avtorizatsiya xatolari uchun (ruxsat yo'q).

**Misol:**
```javascript
throw new AuthorizationError('Admin ruxsati kerak');
throw new AuthorizationError(); // Default: "Ruxsat berilmagan"
```

**HTTP Status:** 403 Forbidden

### 5. NotFoundError

Ma'lumot topilmagan xatolari uchun.

**Parametrlar:**
- `resource` (string, optional): Resurs nomi

**Misol:**
```javascript
throw new NotFoundError('Mahsulot');
// Natija: "Mahsulot topilmadi"

throw new NotFoundError();
// Natija: "Ma'lumot topilmadi"
```

**HTTP Status:** 404 Not Found

### 6. ConflictError

Konflikt xatolari uchun (masalan, duplicate key).

**Misol:**
```javascript
throw new ConflictError('Bu telefon raqam allaqachon mavjud');
```

**HTTP Status:** 409 Conflict

### 7. DatabaseError

Database xatolari uchun.

**Misol:**
```javascript
throw new DatabaseError('MongoDB connection failed');
throw new DatabaseError(); // Default: "Ma'lumotlar bazasi xatosi"
```

**HTTP Status:** 500 Internal Server Error

## Ishlatish Misollari

### Controller da
```javascript
const { NotFoundError, ValidationError } = require('../utils/errors');

async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new NotFoundError('Mahsulot');
  }
  
  res.json({ success: true, data: product });
}
```

### Service da
```javascript
const { ConflictError } = require('../utils/errors');

async function createUser(userData) {
  const existingUser = await User.findOne({ phone: userData.phone });
  
  if (existingUser) {
    throw new ConflictError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
  }
  
  return await User.create(userData);
}
```

### Middleware da
```javascript
const { AuthenticationError } = require('../utils/errors');

function auth(req, res, next) {
  const token = req.header('Authorization');
  
  if (!token) {
    throw new AuthenticationError('Token topilmadi');
  }
  
  // Token tekshirish...
  next();
}
```

## Error Response Formati

Barcha xatolar quyidagi formatda qaytariladi:

```json
{
  "success": false,
  "error": {
    "message": "Mahsulot topilmadi",
    "code": "NOT_FOUND"
  }
}
```

Validatsiya xatolari uchun:
```json
{
  "success": false,
  "error": {
    "message": "Validatsiya xatosi",
    "code": "VALIDATION_ERROR",
    "errors": [
      { "field": "name", "message": "Ism kiritilmagan" },
      { "field": "phone", "message": "Telefon noto'g'ri" }
    ]
  }
}
```

## Error Codes

| Error Class | Error Code | HTTP Status |
|------------|------------|-------------|
| AppError | Custom | Custom |
| ValidationError | VALIDATION_ERROR | 400 |
| AuthenticationError | AUTHENTICATION_ERROR | 401 |
| AuthorizationError | AUTHORIZATION_ERROR | 403 |
| NotFoundError | NOT_FOUND | 404 |
| ConflictError | CONFLICT_ERROR | 409 |
| DatabaseError | DATABASE_ERROR | 500 |

## Muhim Eslatmalar

1. Har doim tegishli error classdan foydalaning
2. Xato xabarlarini foydalanuvchi tushunadigan qilib yozing
3. Maxfiy ma'lumotlarni xato xabarida ko'rsatmang
4. Error code orqali frontend da xatolarni handle qilish oson

## Bog'liq Modullar

- `middleware/errorHandler.js` - Xatolarni catch qilish
- `utils/logger.js` - Xatolarni log qilish
- `utils/asyncHandler.js` - Async xatolarni handle qilish

## Best Practices

```javascript
// ✅ To'g'ri
throw new NotFoundError('Mahsulot');

// ❌ Noto'g'ri
throw new Error('Product not found');

// ✅ To'g'ri
throw new ValidationError('Ma\'lumotlar noto\'g\'ri', [
  { field: 'price', message: 'Narx musbat bo\'lishi kerak' }
]);

// ❌ Noto'g'ri
res.status(400).json({ error: 'Invalid data' });
```
