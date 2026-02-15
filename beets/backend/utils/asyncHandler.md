# 🔄 Async Handler - Async Xatolarni Boshqarish

## Maqsad

Controller funksiyalarida try-catch bloklarini yo'qotish va async xatolarni avtomatik handle qilish.

## Joylashuv

`server/src/utils/asyncHandler.js`

## Funksiya

### asyncHandler(fn)

Async funksiyani wrap qilib, xatolarni avtomatik catch qiladi.

**Parametrlar:**
- `fn` (function): Async controller funksiyasi

**Qaytaradi:**
- Express middleware funksiyasi

## Muammo

Odatda har bir async controller da try-catch yozish kerak:

```javascript
// ❌ Noqulay usul
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
```

## Yechim

asyncHandler bilan try-catch kerak emas:

```javascript
// ✅ Qulay usul
const { asyncHandler } = require('../utils/asyncHandler');

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, data: products });
});
```

## Qanday Ishlaydi

1. Async funksiyani Promise.resolve() ga o'raydi
2. Agar xato yuz bersa, `.catch(next)` orqali error handler ga yuboradi
3. Error handler xatoni to'g'ri formatda qaytaradi

## Ishlatish Misollari

### Oddiy GET Request
```javascript
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new NotFoundError('Mahsulot');
  }
  
  res.json({ success: true, data: product });
});
```

### POST Request
```javascript
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  
  res.status(201).json({
    success: true,
    data: product
  });
});
```

### Service bilan
```javascript
const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.user.id
  );
  
  res.json({ success: true, data: product });
});
```

### Xato bilan
```javascript
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new NotFoundError('Mahsulot'); // Avtomatik catch qilinadi
  }
  
  await product.remove();
  
  res.json({ 
    success: true, 
    message: 'Mahsulot o\'chirildi' 
  });
});
```

## Route da Ishlatish

```javascript
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const productController = require('../controllers/product.controller');

// Har bir route asyncHandler bilan wrap qilingan
router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProduct));
router.post('/', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

module.exports = router;
```

## Afzalliklari

1. **Kod Tozaligi**: Try-catch bloklari yo'q
2. **Xatolarni Avtomatik Handle**: Barcha xatolar error handler ga boradi
3. **Kod Takrorlanmaydi**: Har bir funksiyada try-catch yozish shart emas
4. **Oson O'qish**: Kod sodda va tushunarli

## Muhim Eslatmalar

1. Faqat async funksiyalar uchun ishlatiladi
2. Xatolar avtomatik error handler ga yuboriladi
3. Custom error classlardan foydalanish mumkin
4. Response yuborishni unutmang

## Bog'liq Modullar

- `middleware/errorHandler.js` - Xatolarni handle qilish
- `utils/errors.js` - Custom error classes
- `controllers/*.js` - Barcha controllerlar

## Kod Taqqoslash

### asyncHandler siz
```javascript
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new NotFoundError('Mahsulot'));
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
```

### asyncHandler bilan
```javascript
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new NotFoundError('Mahsulot');
  }
  res.json({ success: true, data: product });
});
```

**Natija**: 40% kam kod, 100% xavfsiz!

## Best Practices

```javascript
// ✅ To'g'ri - asyncHandler ishlatish
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json({ success: true, data: products });
});

// ❌ Noto'g'ri - try-catch ishlatish
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// ✅ To'g'ri - Custom error throw qilish
throw new NotFoundError('Mahsulot');

// ❌ Noto'g'ri - next() ishlatish
return next(new NotFoundError('Mahsulot'));
```
