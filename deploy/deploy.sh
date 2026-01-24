#!/bin/bash

# Deploy script for universalbozor.uz
# Run this on VPS: bash deploy.sh

set -e

APP_DIR="/var/www/universalbozor"
REPO_URL="https://github.com/Yuxanno/universal.uz.git"

echo "🚀 Starting deployment..."

# 1. Create directory
mkdir -p $APP_DIR
cd $APP_DIR

# 2. Clone or pull repo
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL .
fi

# 3. Install dependencies and build client
echo "📦 Installing client dependencies..."
cd client
npm install
echo "🔨 Building client..."
npm run build
cd ..

# 4. Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# 5. Setup nginx config (without breaking other sites)
echo "⚙️ Setting up nginx..."
cp deploy/nginx-universalbozor.conf /etc/nginx/sites-available/universalbozor
ln -sf /etc/nginx/sites-available/universalbozor /etc/nginx/sites-enabled/

# Test nginx config before reload
nginx -t

# 6. Reload nginx
systemctl reload nginx

# 7. Setup PM2 for backend
echo "🔄 Starting backend with PM2..."
cd server
pm2 delete universalbozor 2>/dev/null || true
pm2 start src/index.js --name universalbozor
pm2 save
cd ..

# 8. Setup SSL with certbot (optional)
echo "🔒 Setting up SSL..."
certbot --nginx -d universalbozor.uz -d www.universalbozor.uz --non-interactive --agree-tos -m your@email.com || echo "SSL setup skipped"

echo "✅ Deployment complete!"
echo "🌐 Site: https://universalbozor.uz"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖨️  ВАЖНО: Настройка принтера"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Если вы используете принтер, выполните:"
echo "  sudo bash deploy/setup-printer.sh"
echo ""
echo "Или следуйте инструкции:"
echo "  - Русский: PRINTER_FIX_README.md"
echo "  - O'zbek: PRINTER_FIX_UZ.md"
echo "  - Подробно: doc/PRINTER_SETUP_LINUX.md"
echo ""
