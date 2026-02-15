# 🛡️ Security Middleware - Xavfsizlik Choralari

## Maqsad

Tizimni turli xil hujumlardan himoya qilish: rate limiting, XSS, injection attacks va boshqalar.

## Joylashuv

`server/src/middleware/security.js`

## Funksiyalar

### 1. apiLimiter

API endpointlari uchun rate limiting.

**Konfiguratsiya:**
- 100 request / 15 daqiqa
- Har bir IP uchun alohida

**Ishlatish:**
```javascript
const { apiLimiter } = require('../middleware/security');

app.use('/api', apiLimiter);
```

**Xato Response:**
```json
{
  "success": false,
  "error": {
    "message": "Juda ko'p so'rov. Keyinroq urinib ko'ring",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

### 2. authLimiter

Login endpoint uchun qattiq rate limiting.

**Konfiguratsiya:**
- 5 request / 15 daqiqa
- Faqat muvaffaqiyatsiz urinishlar hisoblanadi
- Muvaffaqiyatli login hisoblanmaydi

**Ishlatish:**
```javascript
const { authLimiter } = require('../middleware/security');

router.post('/login', authLimiter, login);
```

**Xato Response:**
```json
{
  "success": false,
  "error": {
    "message": "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring",
    "code": "AUTH_RATE_LIMIT_EXCEEDED"
  }
}
```

### 3. helmetConfig

HTTP security headers qo'shadi.

**Himoya:**
- XSS attacks
- Clickjacking
- MIME sniffing
- Content Security Policy

**Ishlatish:**
```javascript
const { helmetConfig } = require('../middleware/security');

app.use(helmetConfig);
```

**Headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### 4. sanitizeInput(req, res, next)

Foydalanuvchi kiritgan ma'lumotlarni tozalaydi (XSS himoyasi).

**Tozalanadigan Joylar:**
- req.body
- req.query
- req.params

**Ishlatish:**
```javascript
const { sanitizeInput } = require('../middleware/security');

app.use(sanitizeInput);
```

**Misol:**
```javascript
// Input
{
  "name": "<script>alert('XSS')</script>Mahsulot",
  "description": "onclick=alert('XSS')"
}

// Output (tozalangan)
{
  "name": "Mahsulot",
  "description": ""
}
```

## To'liq Konfiguratsiya

```javascript
const express = require('express');
const { 
  apiLimiter, 
  authLimiter, 
  helmetConfig, 
  sanitizeInput 
} = require('./middleware/security');

const app = express();

// 1. Helmet (security headers)
app.use(helmetConfig);

// 2. Input sanitization
app.use(sanitizeInput);

// 3. Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
```

## Rate Limiting Tafsilotlari

### API Limiter
```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 daqiqa
  max: 100,                   // 100 request
  message: {
    success: false,
    error: {
      message: 'Juda ko\'p so\'rov',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
}
```

### Auth Limiter
```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 daqiqa
  max: 5,                     // 5 urinish
  skipSuccessfulRequests: true, // Muvaffaqiyatli loginlar hisoblanmaydi
  message: {
    success: false,
    error: {
      message: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  }
}
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345678
```

## Input Sanitization

### XSS Himoyasi

**O'chiriladigan Patternlar:**
```javascript
// <script> tags
/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi

// javascript: URLs
/javascript:/gi

// Event handlers
/on\w+\s*=/gi
```

**Misol:**
```javascript
// Input
const input = {
  name: "<script>alert('XSS')</script>Product",
  price: "100",
  description: "Good product onclick=alert('XSS')"
};

// Output
const sanitized = {
  name: "Product",
  price: "100",
  description: "Good product "
};
```

### Nested Objects
```javascript
// Input
const input = {
  product: {
    name: "<script>alert('XSS')</script>",
    variants: [
      { name: "onclick=alert('XSS')" }
    ]
  }
};

// Output (rekursiv tozalash)
const sanitized = {
  product: {
    name: "",
    variants: [
      { name: "" }
    ]
  }
};
```

## Helmet Configuration

### Content Security Policy
```javascript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],           // Faqat o'z domendan
      styleSrc: ["'self'", "'unsafe-inline'"], // Inline CSS ruxsat
      scriptSrc: ["'self'"],            // Faqat o'z scriptlar
      imgSrc: ["'self'", 'data:', 'https:'] // Rasmlar
    }
  }
}
```

### Boshqa Headers
```javascript
{
  crossOriginEmbedderPolicy: false,  // CORS uchun
  crossOriginResourcePolicy: false,  // CORS uchun
  crossOriginOpenerPolicy: false     // CORS uchun
}
```

## Xavfsizlik Best Practices

### 1. Rate Limiting
```javascript
// ✅ To'g'ri - har xil endpoint uchun har xil limit
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ❌ Noto'g'ri - barcha endpoint uchun bir xil
app.use(apiLimiter);
```

### 2. Input Sanitization
```javascript
// ✅ To'g'ri - barcha input tozalanadi
app.use(sanitizeInput);

// ❌ Noto'g'ri - faqat ba'zi routelarda
router.post('/products', sanitizeInput, createProduct);
```

### 3. Helmet
```javascript
// ✅ To'g'ri - birinchi middleware
app.use(helmetConfig);
app.use(express.json());

// ❌ Noto'g'ri - oxirgi middleware
app.use(express.json());
app.use(helmetConfig);
```

## Testing

### Rate Limiting Test
```javascript
describe('Rate Limiting', () => {
  it('should block after 100 requests', async () => {
    // 100 ta request yuborish
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/products');
    }
    
    // 101-chi request bloklangan bo'lishi kerak
    const res = await request(app)
      .get('/api/products')
      .expect(429);
    
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### XSS Test
```javascript
describe('XSS Protection', () => {
  it('should sanitize script tags', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        name: "<script>alert('XSS')</script>Product"
      });
    
    const product = await Product.findById(res.body.data._id);
    expect(product.name).not.toContain('<script>');
  });
});
```

## Muhim Eslatmalar

1. **Rate Limiting**: Reverse proxy (nginx) orqali ham qo'shish mumkin
2. **Input Sanitization**: Validatsiyadan keyin ham kerak
3. **Helmet**: CORS bilan konflikt bo'lishi mumkin
4. **Trust Proxy**: Nginx orqali ishlaganda `app.set('trust proxy', 1)`

## Bog'liq Modullar

- `config/index.js` - Rate limit konfiguratsiyasi
- `middleware/errorHandler.js` - Xatolarni handle qilish
- `utils/logger.js` - Xavfsizlik hodisalarini log qilish

## Qo'shimcha Xavfsizlik

### CORS
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### MongoDB Injection
```javascript
// Mongoose avtomatik himoya qiladi
// Lekin qo'shimcha tekshirish:
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

### SQL Injection
```javascript
// MongoDB ishlatganimiz uchun SQL injection yo'q
// Lekin agar SQL ishlatilsa:
// - Prepared statements
// - Parameterized queries
```

## Production Checklist

- [x] Rate limiting yoqilgan
- [x] Helmet konfiguratsiyalangan
- [x] Input sanitization ishlayapti
- [x] CORS to'g'ri sozlangan
- [ ] SSL/TLS sertifikatlari
- [ ] Firewall sozlangan
- [ ] DDoS himoyasi
- [ ] Regular security audits
