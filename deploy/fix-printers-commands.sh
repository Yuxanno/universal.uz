#!/bin/bash

# Команды для быстрого исправления проблемы с принтерами
# Скопируйте и вставьте в терминал сервера

echo "🚀 Исправление проблемы с принтерами..."
echo ""

# 1. Обновление кода
echo "📥 Обновление кода..."
cd /var/www/universalbozor
git pull origin main

# 2. Установка зависимостей
echo "📦 Установка зависимостей..."
cd server
npm install

# 3. Перезапуск приложения
echo "🔄 Перезапуск приложения..."
pm2 restart universalbozor

# 4. Проверка CUPS
echo "🖨️  Проверка CUPS..."
if ! command -v lpstat &> /dev/null; then
    echo "⚠️  CUPS не установлен. Установка..."
    sudo apt update
    sudo apt install -y cups cups-client
    sudo systemctl start cups
    sudo systemctl enable cups
else
    echo "✅ CUPS установлен"
fi

# 5. Проверка принтеров
echo ""
echo "📋 Список принтеров:"
lpstat -p -d

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Код обновлен и приложение перезапущено"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Если принтер не настроен, выполните:"
echo "  sudo bash deploy/setup-printer.sh"
echo ""
echo "Или настройте вручную:"
echo "  sudo lpadmin -p \"Xprinter-XP-365B\" -E -v usb://XPrinter/XP-365B -m raw"
echo "  sudo lpoptions -d \"Xprinter-XP-365B\""
echo "  sudo usermod -aG lp \$USER"
echo ""
