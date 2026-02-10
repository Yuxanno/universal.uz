# 🏛️ SYSTEM ARCHITECTURE

## Overview

Universal UZ is a Point of Sale (POS) system built with modern web technologies, designed for retail businesses in Uzbekistan.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, express-rate-limit

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router v6

### External Services
- **Telegram Bot API**: Customer notifications
- **Thermal Printer**: Receipt printing

## Architecture Patterns

### Backend Architecture (Refactored)

```
┌─────────────────────────────────────────────────────────┐
│                     Client Request                       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Middleware Layer                        │
│  • Security (Helmet, Rate Limit, Sanitization)          │
│  • Authentication (JWT Verification)                     │
│  • Authorization (Role-based)                            │
│  • Validation (Joi Schemas)                              │
│  • Logging (Morgan, Winston)                             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Controller Layer                        │
│  • HTTP Request/Response Handling                        │
│  • Input Parsing                                         │
│  • Response Formatting                                   │
│  • Error Handling                                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   Service Layer                          │
│  • Business Logic                                        │
│  • Data Validation                                       │
│  • Transaction Management                                │
│  • External Service Integration                          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Model Layer                           │
│  • Database Schema                                       │
│  • Data Access                                           │
│  • Relationships                                         │
│  • Indexes                                               │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   MongoDB Database                       │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
server/
├── src/
│   ├── config/              # Configuration management
│   │   └── index.js         # Centralized config
│   ├── controllers/         # HTTP request handlers
│   │   └── product.controller.js
│   ├── services/            # Business logic layer
│   │   └── product.service.js
│   ├── validators/          # Request validation schemas
│   │   └── product.validator.js
│   ├── models/              # Database models
│   │   ├── Product.js
│   │   ├── Customer.js
│   │   ├── Debt.js
│   │   └── ...
│   ├── routes/              # API routes
│   │   ├── products.v2.js   # Refactored routes
│   │   └── products.js      # Legacy routes
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication
│   │   ├── validator.js     # Validation
│   │   ├── errorHandler.js  # Error handling
│   │   └── security.js      # Security middleware
│   ├── utils/               # Utility functions
│   │   ├── errors.js        # Custom error classes
│   │   ├── logger.js        # Logging utility
│   │   └── asyncHandler.js  # Async wrapper
│   ├── telegram/            # Telegram bot integration
│   └── index.v2.js          # Server entry point (refactored)
└── package.json

client/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/              # UI components
│   │   ├── pos/             # POS-specific components
│   │   └── debts/           # Debt management components
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── cashier/         # Cashier pages
│   │   └── helper/          # Helper pages
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ProductsContext.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── App.tsx              # Main app component
└── package.json
```

## Data Flow

### Request Flow (Refactored)

1. **Client** sends HTTP request
2. **Security Middleware** validates and sanitizes input
3. **Auth Middleware** verifies JWT token
4. **Authorization Middleware** checks user permissions
5. **Validation Middleware** validates request data against Joi schema
6. **Controller** receives validated request
7. **Service** executes business logic
8. **Model** interacts with database
9. **Service** returns data to controller
10. **Controller** formats response
11. **Error Handler** catches any errors
12. **Client** receives response

### Real-time Updates (Socket.IO)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client A  │◄────────┤  Socket.IO  │────────►│   Client B  │
└─────────────┘         │   Server    │         └─────────────┘
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   Database  │
                        └─────────────┘
```

Events:
- `product-updated`: Product data changed
- `debt-updated`: Debt status changed
- `receipt-created`: New receipt created
- `inventory-updated`: Inventory changed

## Security Architecture

### Authentication Flow

```
1. User Login
   ├─► Validate credentials
   ├─► Generate JWT token
   │   ├─► Payload: { id, role }
   │   ├─► Secret: JWT_SECRET
   │   └─► Expiry: 7d (admin/cashier), 5y (helper)
   └─► Return token to client

2. Authenticated Request
   ├─► Extract token from Authorization header
   ├─► Verify token signature
   ├─► Check token expiry
   ├─► Load user from database
   └─► Attach user to request
```

### Authorization Levels

- **Admin**: Full access to all features
- **Cashier**: POS operations, customer management
- **Helper**: Limited to scanning and basic operations

### Security Measures

1. **Input Validation**: Joi schemas for all inputs
2. **Input Sanitization**: XSS prevention
3. **Rate Limiting**: 100 requests per 15 minutes
4. **Auth Rate Limiting**: 5 login attempts per 15 minutes
5. **Security Headers**: Helmet.js
6. **CORS**: Restricted to configured client URL
7. **Password Hashing**: bcrypt
8. **JWT Tokens**: Signed and verified

## Database Schema

### Core Collections

#### Products
```javascript
{
  code: String (unique, indexed),
  name: String (unique, case-insensitive),
  price: Number,
  costPrice: Number,
  quantity: Number,
  warehouse: ObjectId (ref: Warehouse),
  soldCount: Number (indexed),
  variants: [{ name, price, quantity }],
  packages: [{ packageCount, unitsPerPackage, totalCost }],
  createdBy: ObjectId (ref: User)
}
```

#### Customers
```javascript
{
  name: String (unique, case-insensitive),
  phone: String (unique),
  address: String,
  debt: Number,
  telegramChatId: String,
  isBlacklisted: Boolean
}
```

#### Debts
```javascript
{
  customer: ObjectId (ref: Customer),
  amount: Number,
  paidAmount: Number,
  status: Enum ['pending', 'paid', 'overdue', 'blacklist'],
  type: Enum ['receivable', 'payable'],
  dueDate: Date,
  receipt: ObjectId (ref: Receipt)
}
```

#### Receipts
```javascript
{
  items: [{ product, quantity, price }],
  total: Number,
  paymentMethod: Enum ['cash', 'card', 'debt'],
  customer: ObjectId (ref: Customer),
  createdBy: ObjectId (ref: User),
  warehouse: ObjectId (ref: Warehouse)
}
```

### Indexes

- Products: `{ warehouse: 1, soldCount: -1, _id: -1 }`
- Products: `{ code: 1 }` (unique)
- Products: `{ name: 1 }` (unique, case-insensitive)
- Debts: `{ customer: 1, status: 1 }`
- Receipts: `{ createdAt: -1 }`

## API Design

### RESTful Endpoints

#### Products (Refactored)
```
GET    /api/v2/products           # List products
GET    /api/v2/products/:id       # Get product
POST   /api/v2/products           # Create product
PUT    /api/v2/products/:id       # Update product
DELETE /api/v2/products/:id       # Delete product
GET    /api/v2/products/next-code # Get next code
GET    /api/v2/products/check-code/:code # Check code
```

### Response Format (Standardized)

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "errors": [ ... ] // Optional validation errors
  }
}
```

## Performance Optimization

### Backend
- Connection pooling (MongoDB)
- Query optimization with indexes
- Lean queries for read operations
- Pagination for large datasets
- Response compression (gzip)
- Caching strategy (planned)

### Frontend
- Code splitting (React.lazy)
- Virtual scrolling for large lists
- Debounced search inputs
- Optimistic UI updates
- Session storage caching
- Image lazy loading

## Monitoring & Logging

### Logging Levels
- **error**: Critical errors
- **warn**: Warning messages
- **info**: General information
- **debug**: Debugging information

### Log Destinations
- **Console**: All environments
- **File**: Production only
  - `error.log`: Error level only
  - `combined.log`: All levels

### Metrics to Monitor
- API response times
- Database query times
- Error rates
- Active connections
- Memory usage
- CPU usage

## Deployment

### Environment Variables
```
NODE_ENV=production
PORT=5050
MONGODB_URI=mongodb://...
JWT_SECRET=<strong-secret>
CLIENT_URL=https://...
TELEGRAM_BOT_TOKEN=...
```

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB connection string
- [ ] Set NODE_ENV=production
- [ ] Configure CORS origin
- [ ] Setup SSL/TLS
- [ ] Configure reverse proxy (nginx)
- [ ] Setup process manager (PM2)
- [ ] Configure log rotation
- [ ] Setup automated backups
- [ ] Configure monitoring
- [ ] Setup error tracking

## Future Improvements

1. **Caching Layer**: Redis for frequently accessed data
2. **Message Queue**: Bull/RabbitMQ for background jobs
3. **Microservices**: Split into smaller services
4. **GraphQL**: Alternative to REST API
5. **Elasticsearch**: Advanced search capabilities
6. **CDN**: Static asset delivery
7. **Load Balancing**: Multiple server instances
8. **Database Replication**: High availability
