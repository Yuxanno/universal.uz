# 🔄 MIGRATION GUIDE

## Overview

This guide helps you migrate from the old codebase to the new refactored architecture.

## 🎯 Quick Start

### For Developers

1. **Pull latest changes**
```bash
git pull origin main
```

2. **Install new dependencies**
```bash
cd server
npm install
```

3. **Update environment variables**
```bash
cp server/.env.example server/.env
# Edit .env and set JWT_SECRET to a strong value
```

4. **Run refactored server**
```bash
cd server
npm run dev:v2
```

5. **Test new endpoints**
```bash
# Old endpoint (still works)
curl http://localhost:5050/api/products

# New endpoint (refactored)
curl http://localhost:5050/api/v2/products
```

## 📚 Understanding the New Architecture

### Old Structure (Before)
```
routes/products.js
  ├─ HTTP handling
  ├─ Validation
  ├─ Business logic
  ├─ Database queries
  └─ Error handling
```

### New Structure (After)
```
routes/products.v2.js     → Route definitions
  ↓
middleware/validator.js   → Input validation
  ↓
controllers/product.controller.js → HTTP handling
  ↓
services/product.service.js → Business logic
  ↓
models/Product.js         → Database schema
```

## 🔧 How to Refactor a Module

### Step 1: Create Validator

```javascript
// validators/customer.validator.js
const { Joi, schemas } = require('../middleware/validator');

const customerValidators = {
  create: Joi.object({
    body: Joi.object({
      name: Joi.string().required(),
      phone: schemas.phone.required(),
      address: Joi.string().optional(),
    }),
  }),
  
  update: Joi.object({
    params: Joi.object({
      id: schemas.objectId.required(),
    }),
    body: Joi.object({
      name: Joi.string().optional(),
      phone: schemas.phone.optional(),
      address: Joi.string().optional(),
    }).min(1),
  }),
};

module.exports = customerValidators;
```

### Step 2: Create Service

```javascript
// services/customer.service.js
const Customer = require('../models/Customer');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

class CustomerService {
  async getCustomers(filters = {}) {
    try {
      const { search, page = 1, limit = 50 } = filters;
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }
      
      const skip = (page - 1) * limit;
      const customers = await Customer.find(query)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      
      return customers;
    } catch (error) {
      logger.error('Error fetching customers:', error);
      throw new DatabaseError('Mijozlarni olishda xatolik');
    }
  }
  
  async createCustomer(customerData, userId) {
    try {
      // Check if phone already exists
      const existing = await Customer.findOne({ phone: customerData.phone });
      if (existing) {
        throw new ConflictError('Bu telefon raqam allaqachon mavjud');
      }
      
      const customer = new Customer({
        ...customerData,
        createdBy: userId,
      });
      
      await customer.save();
      
      logger.info(`Customer created: ${customer.name}`, {
        customerId: customer._id,
        userId,
      });
      
      return customer;
    } catch (error) {
      if (error.isOperational) throw error;
      logger.error('Error creating customer:', error);
      throw new DatabaseError('Mijoz yaratishda xatolik');
    }
  }
  
  // Add more methods...
}

module.exports = new CustomerService();
```

### Step 3: Create Controller

```javascript
// controllers/customer.controller.js
const customerService = require('../services/customer.service');
const { asyncHandler } = require('../utils/asyncHandler');

class CustomerController {
  getCustomers = asyncHandler(async (req, res) => {
    const customers = await customerService.getCustomers(req.query);
    
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  });
  
  createCustomer = asyncHandler(async (req, res) => {
    const customer = await customerService.createCustomer(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Mijoz muvaffaqiyatli yaratildi',
      data: customer,
    });
  });
  
  // Add more methods...
}

module.exports = new CustomerController();
```

### Step 4: Create Routes

```javascript
// routes/customers.v2.js
const express = require('express');
const customerController = require('../controllers/customer.controller');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const customerValidators = require('../validators/customer.validator');

const router = express.Router();

router.get(
  '/',
  auth,
  validate(customerValidators.list),
  customerController.getCustomers
);

router.post(
  '/',
  auth,
  authorize('admin', 'cashier'),
  validate(customerValidators.create),
  customerController.createCustomer
);

// Add more routes...

module.exports = router;
```

### Step 5: Register Routes

```javascript
// index.v2.js
const customerRoutesV2 = require('./routes/customers.v2');

// Mount routes
app.use('/api/v2/customers', customerRoutesV2);
```

## 🔄 Frontend Migration

### Old API Call
```typescript
// Old way
const response = await fetch('http://localhost:5050/api/products');
const products = await response.json();
```

### New API Call
```typescript
// New way
const response = await fetch('http://localhost:5050/api/v2/products');
const result = await response.json();

if (result.success) {
  const products = result.data;
} else {
  console.error(result.error.message);
}
```

### Create API Service Layer

```typescript
// client/src/services/api.service.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v2',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.message);
    }
    throw error;
  }
);

export default api;
```

```typescript
// client/src/services/product.service.ts
import api from './api.service';

export const productService = {
  async getProducts(filters = {}) {
    const response = await api.get('/products', { params: filters });
    return response.data;
  },
  
  async getProductById(id: string) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  async createProduct(data: any) {
    const response = await api.post('/products', data);
    return response.data;
  },
  
  async updateProduct(id: string, data: any) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  
  async deleteProduct(id: string) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
```

## 🧪 Testing New Endpoints

### Manual Testing

```bash
# Get products
curl http://localhost:5050/api/v2/products

# Get product by ID
curl http://localhost:5050/api/v2/products/507f1f77bcf86cd799439011

# Create product (with auth)
curl -X POST http://localhost:5050/api/v2/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "12345",
    "name": "Test Product",
    "price": 10000,
    "warehouse": "507f1f77bcf86cd799439011"
  }'

# Update product
curl -X PUT http://localhost:5050/api/v2/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 15000
  }'

# Delete product
curl -X DELETE http://localhost:5050/api/v2/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import collection (create one)
2. Set environment variables:
   - `baseUrl`: `http://localhost:5050/api/v2`
   - `token`: Your JWT token
3. Test all endpoints

## 🚨 Common Issues

### Issue 1: JWT_SECRET Error
```
Error: JWT_SECRET is required in environment variables
```

**Solution**: Set a strong JWT_SECRET in `.env`
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=<generated-secret>
```

### Issue 2: Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validatsiya xatosi",
    "code": "VALIDATION_ERROR",
    "errors": [
      {
        "field": "body.name",
        "message": "\"name\" is required"
      }
    ]
  }
}
```

**Solution**: Check request body matches validator schema

### Issue 3: Authorization Error
```json
{
  "success": false,
  "error": {
    "message": "Bu amalni bajarish uchun ruxsat yo'q",
    "code": "AUTHORIZATION_ERROR"
  }
}
```

**Solution**: Check user role has permission for this endpoint

### Issue 4: Rate Limit Error
```json
{
  "success": false,
  "error": {
    "message": "Juda ko'p so'rov yuborildi",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

**Solution**: Wait 15 minutes or adjust rate limit in config

## 📋 Migration Checklist

### Backend
- [ ] Install new dependencies (`npm install`)
- [ ] Create `.env` from `.env.example`
- [ ] Set strong `JWT_SECRET`
- [ ] Test new server (`npm run dev:v2`)
- [ ] Test all v2 endpoints
- [ ] Check logs are working
- [ ] Verify error handling
- [ ] Test rate limiting
- [ ] Test authentication
- [ ] Test authorization

### Frontend
- [ ] Create API service layer
- [ ] Update API calls to use v2 endpoints
- [ ] Handle new response format
- [ ] Handle new error format
- [ ] Test all features
- [ ] Update error messages
- [ ] Test loading states
- [ ] Test error states

### Database
- [ ] Backup database
- [ ] Run any migrations (if needed)
- [ ] Verify indexes
- [ ] Test queries

### Deployment
- [ ] Update environment variables
- [ ] Update deployment scripts
- [ ] Test in staging
- [ ] Monitor logs
- [ ] Monitor errors
- [ ] Monitor performance

## 🎓 Best Practices

### DO ✅
- Use new v2 endpoints for new features
- Follow the layered architecture
- Write validators for all inputs
- Use custom error classes
- Log important events
- Handle errors properly
- Write tests (coming soon)

### DON'T ❌
- Mix business logic in controllers
- Skip validation
- Use console.log (use logger)
- Hardcode configuration
- Ignore errors
- Skip authorization checks
- Expose sensitive data in errors

## 📞 Getting Help

1. **Read Documentation**
   - [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)
   - [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)

2. **Check Examples**
   - Look at `product.service.js`
   - Look at `product.controller.js`
   - Look at `product.validator.js`
   - Look at `products.v2.js`

3. **Ask Team**
   - Create an issue
   - Ask in team chat
   - Schedule code review

## 🚀 Next Steps

After migration:
1. Remove old code
2. Update documentation
3. Add tests
4. Setup CI/CD
5. Monitor production

---

**Happy Migrating!** 🎉
