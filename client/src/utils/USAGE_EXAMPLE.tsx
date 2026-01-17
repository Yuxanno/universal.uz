/**
 * Примеры использования конвертации UZ Latin ↔ UZ Cyrillic
 */

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useProductName } from '../hooks/useProductName';
import { uzLatToCyr } from './uzLatToCyr';

// ============================================
// ПРИМЕР 1: Использование в компоненте с хуком useLanguage
// ============================================
export function ProductCard({ product }: { product: { name: string; price: number } }) {
  const { t } = useLanguage();
  
  return (
    <div className="product-card">
      {/* Автоматическая конвертация через t() */}
      <h3>{t(product.name)}</h3>
      <p>{product.price} {t("so'm")}</p>
    </div>
  );
}

// ============================================
// ПРИМЕР 2: Использование с хуком useProductName
// ============================================
export function ProductList({ products }: { products: Array<{ _id: string; name: string }> }) {
  const { convertName, script } = useProductName();
  
  return (
    <div>
      <p>Текущий язык: {script === 'latin' ? 'Lotin' : 'Кирилл'}</p>
      <ul>
        {products.map(product => (
          <li key={product._id}>
            {convertName(product.name)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// ПРИМЕР 3: Прямое использование функции uzLatToCyr
// ============================================
export function DirectConversion() {
  const productName = "o'qituvchi";
  const cyrillicName = uzLatToCyr(productName); // "ўқитувчи"
  
  return (
    <div>
      <p>Латиница: {productName}</p>
      <p>Кириллица: {cyrillicName}</p>
    </div>
  );
}

// ============================================
// ПРИМЕР 4: Конвертация в таблице товаров
// ============================================
export function ProductTable({ products }: { products: Array<{ _id: string; name: string; code: string; price: number }> }) {
  const { t } = useLanguage();
  
  return (
    <table>
      <thead>
        <tr>
          <th>{t('Kod')}</th>
          <th>{t('Nomi')}</th>
          <th>{t('Narx')}</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => (
          <tr key={product._id}>
            <td>{product.code}</td>
            {/* Название товара автоматически конвертируется */}
            <td>{t(product.name)}</td>
            <td>{product.price} {t("so'm")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================
// ПРИМЕР 5: Переключатель языка
// ============================================
export function LanguageSwitcher() {
  const { script, setScript } = useLanguage();
  
  return (
    <div className="language-switcher">
      <button
        onClick={() => setScript('latin')}
        className={script === 'latin' ? 'active' : ''}
      >
        Lotin
      </button>
      <button
        onClick={() => setScript('cyrillic')}
        className={script === 'cyrillic' ? 'active' : ''}
      >
        Кирилл
      </button>
    </div>
  );
}

// ============================================
// ПРИМЕР 6: Форма добавления товара
// ============================================
export function AddProductForm() {
  const { t } = useLanguage();
  const [name, setName] = React.useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // В БД сохраняем только латиницу
    const productData = {
      name: name, // Всегда латиница
      // ... другие поля
    };
    
    // Отправляем на сервер
    console.log('Сохраняем:', productData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <label>
        {t('Nomi')}:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("Tovar nomi yoki kodi...")}
        />
      </label>
      <button type="submit">{t('Saqlash')}</button>
      
      {/* Предпросмотр в обоих форматах */}
      <div className="preview">
        <p>Латиница: {name}</p>
        <p>Кириллица: {uzLatToCyr(name)}</p>
      </div>
    </form>
  );
}
