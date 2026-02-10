# ⚡ QUICK START GUIDE

## 🎯 For Developers Who Want to Start Immediately

### 1️⃣ Setup (5 minutes)

```bash
# Clone and install
git clone <repo-url>
cd universal-uz

# Backend setup
cd server
npm install
cp .env.example .env

# ⚠️ IMPORTANT: Edit .env and set JWT_SECRET
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Frontend setup
cd ../client
npm install
cp .env.example .env
```

### 2️⃣ Run (1 minute)

```bash
# Terminal 1: Backend (Refactored)
cd server
npm run dev:v2

# Terminal 2: Frontend
cd client
npm run dev
```

### 3️⃣ Test (2 minutes)

```bash
# Open browser
http://localhost:5173

# Test API
curl http://localhost:5050/health
curl http://localhost:5050/api/v2/products
```

## 🎓 What Changed?

### Old Code ❌
```javascript
// Everything mixed together
router.get('/', auth, async (req, res) => {
  try {
    // validation
    // business logic
    // database query
    // response
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
});
```

### New Code ✅
```javascript
// Clean separation
router.get('/', auth, validate(schema), controller.method);

// Controller handles HTTP
controller.method = asyncHandler(async (req, res) => {
  const data = await service.method(req.query);
  res.json({ success: true, data });
});

// Service handles business logic
service.method = async (filters) => {
  return await Model.find(filters).lean();
};
```

## 📚 Key Files

### Backend
- `server/src/index.v2.js` - New server entry point
- `server/src/routes/products.v2.js` - Example refactored route
- `server/src/controllers/product.controller.js` - Example controller
- `server/src/services/product.service.js` - Example service
- `server/src/validators/product.validator.js` - Example validator

### Documentation
- `README.md` - Project overview
- `ARCHITECTURE.md` - Complete architecture docs
- `MIGRATION_GUIDE.md` - How to migrate code
- `REFACTORING_SUMMARY.md` - What was done

## 🚀 New Features

### 1. Centralized Error Handling
```javascript
// Throw custom errors anywhere
throw new NotFoundError('Product');
throw new ValidationError('Invalid input', errors);
throw new ConflictError('Duplicate code');

// Automatically handled and formatted
```

### 2. Validation with Joi
```javascript
// Define schema once
const schema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().min(0).required(),
});

// Use in routes
router.post('/', validate(schema), controller.create);
```

### 3. Structured Logging
```javascript
// Use logger instead of console.log
logger.info('Product created', { productId, userId });
logger.error('Database error', { error });
logger.warn('Rate limit exceeded', { ip });
```

### 4. Security Enhancements
- ✅ Helmet (security headers)
- ✅ Rate limiting (100 req/15min)
- ✅ Input sanitization (XSS prevention)
- ✅ Auth rate limiting (5 attempts/15min)

### 5. API Versioning
```
Old: /api/products
New: /api/v2/products
```

## 🎯 Quick Commands

```bash
# Backend
npm run dev        # Old server
npm run dev:v2     # New refactored server
npm run start      # Production (old)
npm run start:v2   # Production (new)

# Frontend
npm run dev        # Development
npm run build      # Production build
npm run preview    # Preview build

# Testing
node server/test-refactored-api.js  # Quick API test
```

## 📋 Checklist

### Before Starting
- [ ] Node.js 18+ installed
- [ ] MongoDB running
- [ ] Git repository cloned
- [ ] Dependencies installed

### Configuration
- [ ] `.env` files created
- [ ] `JWT_SECRET` set (strong value!)
- [ ] `MONGODB_URI` configured
- [ ] `CLIENT_URL` set

### Testing
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can access http://localhost:5050/health
- [ ] Can login
- [ ] Can see products

## 🆘 Common Issues

### "JWT_SECRET is required"
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to server/.env
JWT_SECRET=<generated-value>
```

### "Cannot connect to MongoDB"
```bash
# Check MongoDB is running
mongosh

# Or start MongoDB
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### "Port already in use"
```bash
# Kill process on port 5050
# Windows: netstat -ano | findstr :5050
# Mac/Linux: lsof -ti:5050 | xargs kill
```

## 📖 Next Steps

1. **Read Documentation**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the system
   - [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Learn to migrate code

2. **Explore Code**
   - Look at `product.service.js` - Business logic example
   - Look at `product.controller.js` - HTTP handling example
   - Look at `products.v2.js` - Route definition example

3. **Start Developing**
   - Use new v2 endpoints for new features
   - Follow the layered architecture
   - Write validators for inputs
   - Use custom error classes
   - Log with Winston

## 🎉 You're Ready!

The refactored codebase is:
- ✅ More maintainable
- ✅ More testable
- ✅ More secure
- ✅ Better documented
- ✅ Following best practices

**Happy coding!** 🚀
