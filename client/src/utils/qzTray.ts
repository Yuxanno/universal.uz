/**
 * QZ Tray Integration для прямой печати на принтеры
 * Документация: https://qz.io/api/
 */

import qz from 'qz-tray';

// Конфигурация сертификата (для production нужен настоящий сертификат)
const QZ_CONFIG = {
  // Для разработки можно использовать без сертификата
  // Для production нужно получить сертификат на https://qz.io/
  certificate: null,
  signature: null,
};

/**
 * Проверка, установлен ли QZ Tray
 */
export async function isQzTrayInstalled(): Promise<boolean> {
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }
    return true;
  } catch (error) {
    console.error('[QZ Tray] Not installed or not running:', error);
    return false;
  }
}

/**
 * Подключение к QZ Tray
 */
export async function connectQzTray(): Promise<void> {
  if (qz.websocket.isActive()) {
    return;
  }

  try {
    // Настройка сертификата (опционально для production)
    if (QZ_CONFIG.certificate && QZ_CONFIG.signature) {
      qz.security.setCertificatePromise(() => {
        return Promise.resolve(QZ_CONFIG.certificate);
      });

      qz.security.setSignaturePromise((toSign: string) => {
        return Promise.resolve(QZ_CONFIG.signature);
      });
    }

    await qz.websocket.connect();
    console.log('[QZ Tray] Connected successfully');
  } catch (error) {
    console.error('[QZ Tray] Connection failed:', error);
    throw new Error('QZ Tray не установлен или не запущен. Скачайте с https://qz.io/download/');
  }
}

/**
 * Отключение от QZ Tray
 */
export async function disconnectQzTray(): Promise<void> {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
    console.log('[QZ Tray] Disconnected');
  }
}

/**
 * Получить список всех принтеров
 */
export async function getQzPrinters(): Promise<string[]> {
  try {
    await connectQzTray();
    const printers = await qz.printers.find();
    console.log('[QZ Tray] Found printers:', printers);
    return printers;
  } catch (error) {
    console.error('[QZ Tray] Failed to get printers:', error);
    throw error;
  }
}

/**
 * Получить принтер по умолчанию
 */
export async function getDefaultQzPrinter(): Promise<string> {
  try {
    await connectQzTray();
    const printer = await qz.printers.getDefault();
    console.log('[QZ Tray] Default printer:', printer);
    return printer;
  } catch (error) {
    console.error('[QZ Tray] Failed to get default printer:', error);
    throw error;
  }
}

/**
 * Печать текстового чека на термопринтер
 */
export async function printReceipt(
  printerName: string,
  receiptText: string
): Promise<void> {
  try {
    await connectQzTray();

    const config = qz.configs.create(printerName);

    const data = [
      {
        type: 'raw',
        format: 'plain',
        data: receiptText,
      },
    ];

    await qz.print(config, data);
    console.log('[QZ Tray] Receipt printed successfully');
  } catch (error) {
    console.error('[QZ Tray] Print failed:', error);
    throw error;
  }
}

/**
 * Печать чека с ESC/POS командами
 */
export async function printReceiptESCPOS(
  printerName: string,
  escposCommands: string
): Promise<void> {
  try {
    await connectQzTray();

    const config = qz.configs.create(printerName);

    const data = [
      {
        type: 'raw',
        format: 'command',
        data: escposCommands,
      },
    ];

    await qz.print(config, data);
    console.log('[QZ Tray] ESC/POS receipt printed successfully');
  } catch (error) {
    console.error('[QZ Tray] ESC/POS print failed:', error);
    throw error;
  }
}

/**
 * Печать HTML (для ценников)
 */
export async function printHTML(
  printerName: string,
  html: string
): Promise<void> {
  try {
    await connectQzTray();

    const config = qz.configs.create(printerName);

    const data = [
      {
        type: 'html',
        format: 'plain',
        data: html,
      },
    ];

    await qz.print(config, data);
    console.log('[QZ Tray] HTML printed successfully');
  } catch (error) {
    console.error('[QZ Tray] HTML print failed:', error);
    throw error;
  }
}

/**
 * Печать PDF
 */
export async function printPDF(
  printerName: string,
  pdfBase64: string
): Promise<void> {
  try {
    await connectQzTray();

    const config = qz.configs.create(printerName);

    const data = [
      {
        type: 'pdf',
        format: 'base64',
        data: pdfBase64,
      },
    ];

    await qz.print(config, data);
    console.log('[QZ Tray] PDF printed successfully');
  } catch (error) {
    console.error('[QZ Tray] PDF print failed:', error);
    throw error;
  }
}

/**
 * Генерация текстового чека для термопринтера 58мм
 */
export function generateReceiptText(receipt: {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  date: string;
  receiptNumber: string;
}): string {
  const width = 32; // символов на строку для 58мм
  const line = '='.repeat(width);
  const thinLine = '-'.repeat(width);

  let text = '';

  // Заголовок
  text += centerText('UNIVERSAL', width) + '\n';
  text += centerText('Savdo markazi', width) + '\n';
  text += line + '\n';

  // Дата и номер
  text += `Sana: ${receipt.date.split(',')[0]}\n`;
  text += `Vaqt: ${receipt.date.split(',')[1]}\n`;
  text += `Chek: #${receipt.receiptNumber}\n`;
  text += thinLine + '\n';

  // Товары
  receipt.items.forEach((item, i) => {
    const name = item.name.length > width - 3 ? item.name.substring(0, width - 3) : item.name;
    text += `${i + 1}. ${name}\n`;

    const qty = `${item.quantity}x${formatNumber(item.price)}`;
    const sum = formatNumber(item.price * item.quantity);
    const spaces = Math.max(1, width - qty.length - sum.length - 3);
    text += `   ${qty}${' '.repeat(spaces)}${sum}\n`;
  });

  text += line + '\n';

  // ИТОГО
  const totalValue = formatNumber(receipt.total);
  text += `JAMI:${' '.repeat(width - 5 - totalValue.length)}${totalValue}\n`;
  text += line + '\n';

  // Способ оплаты
  const pay = receipt.paymentMethod === 'cash' ? 'Naqd' : 'Karta';
  text += centerText(`To'lov: ${pay}`, width) + '\n';
  text += thinLine + '\n';

  // Футер
  text += centerText('Rahmat!', width) + '\n';
  text += '\n\n\n\n'; // Пустые строки для отрыва

  return text;
}

// Вспомогательные функции
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function formatNumber(num: number): string {
  return String(num || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Проверка статуса QZ Tray
 */
export async function getQzTrayStatus(): Promise<{
  installed: boolean;
  connected: boolean;
  version?: string;
}> {
  try {
    const installed = await isQzTrayInstalled();
    
    if (!installed) {
      return { installed: false, connected: false };
    }

    const version = await qz.api.getVersion();
    
    return {
      installed: true,
      connected: qz.websocket.isActive(),
      version,
    };
  } catch (error) {
    return { installed: false, connected: false };
  }
}
