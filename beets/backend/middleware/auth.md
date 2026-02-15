# 🔐 Authentication & Authorization Middleware

## Maqsad

Foydalanuvchilarni autentifikatsiya qilish (kim ekanligini aniqlash) va avtorizatsiya qilish (ruxsatlarini tekshirish).

## Joylashuv

`server/src/middleware/auth.js`

## Funksiyalar

### 1. auth(req, res, next)

JWT token orqali foydalanuvchini autentifikatsiya qiladi.

**Ishlash Tartibi:**
1. Authorization header dan token oladi
2. Token ni verify qiladi
3. User ni database dan topadi
4. User ni request ga biriktiradi

**Misol:**
```javascript
const { auth } = require('../middleware/auth');

// Route da ishlatish
router.get('/profile', auth, getProfile);
```

**Xatolar:**
- Token yo'q: `401 - Token topilmadi`
- Token yaroqsiz: `401 - Token yaroqsiz`
- Token muddati tugagan: `401 - Token muddati tugagan`
- User topilmadi: `401 - Foydalanuvchi topilmadi`

### 2. authorize(...roles)

Foydalanuvchi rolini tekshiradi.

**Parametrlar:**
- `roles` (string[]): Ruxsat berilgan rollar ro'yxati

**Misol:**
```javascript
const { auth, authorize } = require('../middleware/auth');

// Faqat admin uchun
router.delete('/products/:id', auth, authorize('admin'), deleteProduct);

// Admin va kassir uchun
router.post('/products', auth, authorize('admin', 'cashier'), createProduct);

// Barcha rollar uchun
router.get('/products', auth, getProducts);
```

**Xatolar:**
- Ruxsat yo'q: `403 - Bu amalni bajarish uchun ruxsat yo'q`

### 3. optionalAuth(req, res, next)

Token bor bo'lsa user ni yuklaydi, yo'q bo'lsa davom etadi.

**Misol:**
```javascript
const { optionalAuth } = require('../middleware/auth');

// Public endpoint, lekin user bor bo'lsa ma'lumot ko'proq
router.get('/products', optionalAuth, getProducts);
```

## Ishlatish Misollari

### Oddiy Autentifikatsiya
```javascript
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Faqat login qilgan userlar uchun
router.get('/profile', auth, (req, res) => {
  res.json({
    success: true,
    data: req.user // auth middleware tomonidan qo'shilgan
  });
});
```

### Rol Asosida Ruxsat
```javascript
const { auth, authorize } = require('../middleware/auth');

// Faqat admin
router.delete('/users/:id', 
  auth, 
  authorize('admin'), 
  deleteUser
);

// Admin va kassir
router.post('/receipts', 
  auth, 
  authorize('admin', 'cashier'), 
  createReceipt
);

// Barcha rollar (faqat login qilgan)
router.get('/products', 
  auth, 
  getProducts
);
```

### Optional Auth
```javascript
const { optionalAuth } = require('../middleware/auth');

// Public endpoint
router.get('/products', optionalAuth, (req, res) => {
  // req.user bor bo'lsa - login qilgan
  // req.user yo'q bo'lsa - mehmon
  
  const products = await Product.find();
  
  if (req.user) {
    // Login qilgan user uchun qo'shimcha ma'lumot
    products.forEach(p => {
      p.isFavorite = user.favorites.includes(p._id);
    });
  }
  
  res.json({ success: true, data: products });
});
```

### Bir Nechta Middleware
```javascript
const { auth, authorize } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validator');

router.post('/products',
  auth,                           // 1. Autentifikatsiya
  authorize('admin', 'cashier'),  // 2. Avtorizatsiya
  validateProduct,                // 3. Validatsiya
  createProduct                   // 4. Controller
);
```

## JWT Token Formati

### Token Yaratish (Login da)
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: user._id },           // Payload
  process.env.JWT_SECRET,     // Secret key
  { expiresIn: '7d' }         // Muddat
);
```

### Token Yuborish (Client dan)
```javascript
// Authorization header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Saqlash (Client da)

**Admin:**
```javascript
// Session storage (browser yopilganda o'chadi)
sessionStorage.setItem('token', token);
```

**Kassir/Helper:**
```javascript
// Local storage (saqlanib qoladi)
localStorage.setItem('token', token);
```

## req.user Obyekti

Auth middleware dan keyin `req.user` da quyidagi ma'lumotlar bo'ladi:

```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "Admin User",
  phone: "+998901234567",
  role: "admin",
  createdAt: "2024-01-15T10:30:00.000Z"
  // password yo'q (select('-password'))
}
```

## Xavfsizlik

### Token Muddati
- Admin: 7 kun
- Kassir: 7 kun
- Helper: 5 yil (doimiy qurilma)

### Token Secret
```env
JWT_SECRET=your-super-secret-key-min-32-characters
```

**Muhim:** Production da kuchli secret ishlatish!

### Rate Limiting
Auth endpointlari uchun maxsus rate limit:
- 5 urinish / 15 daqiqa
- Muvaffaqiyatli loginlar hisoblanmaydi

## Xatolarni Handle Qilish

### Backend
```javascript
const { auth } = require('../middleware/auth');

router.get('/profile', auth, (req, res) => {
  // Agar token yo'q yoki yaroqsiz bo'lsa,
  // auth middleware avtomatik 401 xato qaytaradi
  res.json({ success: true, data: req.user });
});
```

### Frontend
```javascript
// Axios interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token yaroqsiz - login ga yo'naltirish
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Muhim Eslatmalar

1. `auth` har doim birinchi middleware bo'lishi kerak
2. `authorize` dan oldin `auth` ishlatish shart
3. Token ni header da yuborish kerak
4. Parolni hech qachon response da qaytarmaslik
5. JWT_SECRET ni `.env` da saqlash

## Bog'liq Modullar

- `models/User.js` - User model
- `config/index.js` - JWT secret
- `utils/errors.js` - Custom errors
- `routes/auth.js` - Login/logout routes

## Best Practices

```javascript
// ✅ To'g'ri - auth birinchi
router.post('/products', auth, authorize('admin'), createProduct);

// ❌ Noto'g'ri - authorize birinchi
router.post('/products', authorize('admin'), auth, createProduct);

// ✅ To'g'ri - parolsiz user
const user = await User.findById(id).select('-password');

// ❌ Noto'g'ri - parol bilan user
const user = await User.findById(id);

// ✅ To'g'ri - kuchli secret
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

// ❌ Noto'g'ri - zaif secret
JWT_SECRET=secret
```

## Testing

```javascript
const request = require('supertest');
const app = require('../app');

describe('Auth Middleware', () => {
  it('should reject request without token', async () => {
    const res = await request(app)
      .get('/api/profile')
      .expect(401);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });
  
  it('should accept request with valid token', async () => {
    const token = 'valid-jwt-token';
    
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
  });
});
```
