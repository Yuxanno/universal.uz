#!/bin/bash

# Автоматическая настройка принтера на Linux сервере
# Использование: sudo bash setup-printer.sh

set -e

echo "🖨️  Настройка принтера для Universal POS..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Запустите скрипт с правами root: sudo bash setup-printer.sh${NC}"
    exit 1
fi

# 1. Установка CUPS
echo -e "${YELLOW}📦 Установка CUPS...${NC}"
apt update
apt install -y cups cups-client

# 2. Запуск CUPS
echo -e "${YELLOW}🚀 Запуск CUPS...${NC}"
systemctl start cups
systemctl enable cups

# 3. Настройка CUPS для удаленного доступа (опционально)
echo -e "${YELLOW}⚙️  Настройка CUPS...${NC}"
cupsctl --remote-admin --remote-any --share-printers

# 4. Проверка подключенных USB устройств
echo -e "${YELLOW}🔍 Поиск USB принтеров...${NC}"
lsusb | grep -i printer || lsusb | grep -i xprinter || echo "Принтер не найден через lsusb"

# 5. Показать доступные устройства
echo -e "${YELLOW}📋 Доступные устройства для печати:${NC}"
lpinfo -v

# 6. Запрос имени принтера
echo ""
echo -e "${GREEN}Введите имя принтера (например: Xprinter-XP-365B):${NC}"
read -p "Имя принтера: " PRINTER_NAME

if [ -z "$PRINTER_NAME" ]; then
    PRINTER_NAME="Xprinter-XP-365B"
    echo -e "${YELLOW}Используется имя по умолчанию: $PRINTER_NAME${NC}"
fi

# 7. Запрос URI устройства
echo ""
echo -e "${GREEN}Введите URI устройства (например: usb://XPrinter/XP-365B):${NC}"
echo "Или нажмите Enter для автоопределения USB принтера"
read -p "URI: " DEVICE_URI

if [ -z "$DEVICE_URI" ]; then
    # Попытка автоопределения USB принтера
    DEVICE_URI=$(lpinfo -v | grep -i usb | grep -i xprinter | head -n1 | awk '{print $2}')
    
    if [ -z "$DEVICE_URI" ]; then
        # Если не нашли XPrinter, берем первый USB принтер
        DEVICE_URI=$(lpinfo -v | grep -i "usb://" | head -n1 | awk '{print $2}')
    fi
    
    if [ -z "$DEVICE_URI" ]; then
        echo -e "${RED}❌ Не удалось автоматически определить USB принтер${NC}"
        echo "Доступные устройства:"
        lpinfo -v
        exit 1
    fi
    
    echo -e "${YELLOW}Автоопределен URI: $DEVICE_URI${NC}"
fi

# 8. Удаление существующего принтера (если есть)
echo -e "${YELLOW}🗑️  Удаление существующего принтера (если есть)...${NC}"
lpadmin -x "$PRINTER_NAME" 2>/dev/null || true

# 9. Добавление принтера
echo -e "${YELLOW}➕ Добавление принтера...${NC}"
lpadmin -p "$PRINTER_NAME" -E -v "$DEVICE_URI" -m raw

# 10. Установка как принтер по умолчанию
echo -e "${YELLOW}⭐ Установка принтера по умолчанию...${NC}"
lpoptions -d "$PRINTER_NAME"

# 11. Включение принтера
echo -e "${YELLOW}✅ Включение принтера...${NC}"
cupsenable "$PRINTER_NAME"
cupsaccept "$PRINTER_NAME"

# 12. Добавление пользователей в группу lp
echo -e "${YELLOW}👥 Настройка прав доступа...${NC}"

# Найти пользователя, который запустил sudo
REAL_USER=${SUDO_USER:-$USER}

if [ "$REAL_USER" != "root" ]; then
    usermod -aG lp "$REAL_USER"
    usermod -aG lpadmin "$REAL_USER"
    echo -e "${GREEN}✅ Пользователь $REAL_USER добавлен в группы lp и lpadmin${NC}"
fi

# Также добавим пользователя www-data (для веб-приложений)
if id "www-data" &>/dev/null; then
    usermod -aG lp www-data
    echo -e "${GREEN}✅ Пользователь www-data добавлен в группу lp${NC}"
fi

# 13. Проверка статуса
echo ""
echo -e "${GREEN}📊 Статус принтера:${NC}"
lpstat -p -d

# 14. Тестовая печать
echo ""
echo -e "${YELLOW}🧪 Хотите выполнить тестовую печать? (y/n)${NC}"
read -p "Ответ: " TEST_PRINT

if [ "$TEST_PRINT" = "y" ] || [ "$TEST_PRINT" = "Y" ]; then
    echo "Тестовая печать" > /tmp/test_print.txt
    echo "Universal POS System" >> /tmp/test_print.txt
    echo "Printer: $PRINTER_NAME" >> /tmp/test_print.txt
    echo "Date: $(date)" >> /tmp/test_print.txt
    echo "================================" >> /tmp/test_print.txt
    
    lp -d "$PRINTER_NAME" /tmp/test_print.txt
    echo -e "${GREEN}✅ Тестовое задание отправлено на печать${NC}"
    
    sleep 2
    echo ""
    echo "Очередь печати:"
    lpq -P "$PRINTER_NAME"
    
    rm /tmp/test_print.txt
fi

# 15. Информация для .env файла
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Принтер успешно настроен!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Добавьте в файл server/.env:${NC}"
echo ""
echo "RECEIPT_PRINTER=$PRINTER_NAME"
echo ""
echo -e "${YELLOW}🔄 Перезапустите приложение:${NC}"
echo ""
echo "pm2 restart universalbozor"
echo ""
echo -e "${YELLOW}🌐 Веб-интерфейс CUPS:${NC}"
echo "http://localhost:631"
echo ""
echo -e "${YELLOW}📚 Полезные команды:${NC}"
echo "  lpstat -p -d              # Статус принтеров"
echo "  lpq -P $PRINTER_NAME      # Очередь печати"
echo "  cancel -a $PRINTER_NAME   # Очистить очередь"
echo "  sudo systemctl status cups # Статус CUPS"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
