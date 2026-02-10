# 🏪 Universal UZ - POS System

Modern Point of Sale (POS) system for retail businesses in Uzbekistan with inventory management, customer debt tracking, and real-time updates.

## 🚀 Features

- **Multi-warehouse Management**: Track inventory across multiple locations
- **POS System**: Fast and intuitive point of sale interface
- **Customer Management**: Track customer information and purchase history
- **Debt Tracking**: Manage receivable and payable debts
- **Real-time Updates**: Socket.IO for instant data synchronization
- **Telegram Integration**: Customer notifications via Telegram bot
- **Receipt Printing**: Thermal printer support
- **Multi-language**: Uzbek and Russian support
- **Role-based Access**: Admin, Cashier, and Helper roles
- **Offline Support**: PWA with offline capabilities

## 🏗️ Architecture

This project follows a **clean, layered architecture** with proper separation of concerns:

```
Backend: Service Layer → Controller Layer → Route Layer
Frontend: React + TypeScript + Context API
Database: MongoDB with optimized indexes
Real-time: Socket.IO
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 📋 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **Socket.IO** for real-time updates
- **JWT** for authentication
- **Joi** for validation
- **Winston** for logging
- **Helmet** + **Rate Limiting** for security

### Frontend
- **React 18** + **TypeScript**
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Context API** for state management

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, JWT_SECRET

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required: VITE_API_URL

# Start development server
npm run dev
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5050
MONGODB_URI=mongodb://localhost:27017/universal_uz
JWT_SECRET=your-super-secret-key-change-this
CLIENT_URL=http://localhost:5173
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CUSTOMER_BOT_TOKEN=your-customer-bot-token
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5050
```

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET` (not "secret"!)
- [ ] Configure production MongoDB URI
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS with production client URL
- [ ] Setup SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Setup process manager (PM2)
- [ ] Configure log rotation
- [ ] Setup automated backups
- [ ] Configure monitoring and error tracking

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start backend
cd server
pm2 start src/index.v2.js --name universal-uz-api

# Start with environment
pm2 start src/index.v2.js --name universal-uz-api --env production
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5050/api
Production: https://your-domain.com/api
```

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Products (Refactored v2)
```
GET    /api/v2/products           # List products
GET    /api/v2/products/:id       # Get product by ID
POST   /api/v2/products           # Create product (Admin, Cashier)
PUT    /api/v2/products/:id       # Update product (Admin, Cashier)
DELETE /api/v2/products/:id       # Delete product (Admin)
GET    /api/v2/products/next-code # Get next available code
```

#### Legacy Endpoints
```
GET    /api/products              # Old products endpoint (deprecated)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## 🧪 Testing

```bash
# Backend tests (coming soon)
cd server
npm test

# Frontend tests (coming soon)
cd client
npm test
```

## 📖 Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture and design patterns
- [Refactoring Plan](./REFACTORING_PLAN.md) - Ongoing refactoring progress and roadmap

## 🔄 Migration from Legacy Code

The project is currently being refactored to senior-level standards. Both old and new code coexist:

- **New (Refactored)**: `/api/v2/*` endpoints with Service/Controller/Validator layers
- **Old (Legacy)**: `/api/*` endpoints (will be deprecated)

Frontend should gradually migrate to v2 endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Backend: Follow existing patterns in `/controllers`, `/services`, `/validators`
- Frontend: Use TypeScript, follow React best practices
- Use ESLint and Prettier (configuration coming soon)
- Write tests for new features

## 📝 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Development**: Universal UZ Team
- **Architecture Refactoring**: In Progress (2024)

## 🐛 Known Issues

See [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) for current technical debt and planned improvements.

## 📞 Support

For support, email support@universal-uz.com or open an issue.

---

**Note**: This project is actively being refactored to meet senior-level code standards. See [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) for progress.
