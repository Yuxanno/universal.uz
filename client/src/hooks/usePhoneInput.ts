import { useState, useCallback } from 'react';

interface UsePhoneInputReturn {
  value: string;
  displayValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
}

export const usePhoneInput = (initialValue: string = ''): UsePhoneInputReturn => {
  const [value, setValue] = useState(() => {
    // Agar bo'sh bo'lsa, +998 bilan boshlash
    if (!initialValue || initialValue.trim() === '') {
      return '+998';
    }
    // Agar +998 bilan boshlanmasa, qo'shish
    const digits = initialValue.replace(/\D/g, '');
    if (!digits.startsWith('998')) {
      return '+998' + digits;
    }
    return '+' + digits;
  });

  const formatPhoneDisplay = useCallback((phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length <= 3) return '+998';
    if (digits.length <= 5) return `+998 (${digits.slice(3)}`;
    if (digits.length <= 8) return `+998 (${digits.slice(3, 5)}) ${digits.slice(5)}`;
    if (digits.length <= 10) return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
    return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }, []);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Faqat raqamlarni olish
    const digits = input.replace(/\D/g, '');
    
    // Agar foydalanuvchi +998 ni o'chirmoqchi bo'lsa, oldini olish
    if (digits.length < 3) {
      setValue('+998');
      return;
    }
    
    // 998 bilan boshlanishini ta'minlash
    let phone = digits;
    if (!phone.startsWith('998')) {
      phone = '998' + phone.slice(3);
    }
    
    // Maksimal 12 ta raqam (998 + 9 ta raqam)
    phone = phone.slice(0, 12);
    
    setValue('+' + phone);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    const currentValue = input.value;
    
    // Backspace yoki Delete bosilganda
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Agar cursor +998 ichida bo'lsa, oldini olish
      if (cursorPosition <= 4) {
        e.preventDefault();
        return;
      }
    }
    
    // Agar foydalanuvchi +998 ni tanlagan bo'lsa
    if (input.selectionStart === 0 && input.selectionEnd && input.selectionEnd >= 4) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setValue('+998');
        return;
      }
    }
  }, []);

  return {
    value,
    displayValue: formatPhoneDisplay(value),
    onChange,
    onKeyDown,
    setValue: (newValue: string) => {
      if (!newValue || newValue.trim() === '') {
        setValue('+998');
      } else {
        const digits = newValue.replace(/\D/g, '');
        if (!digits.startsWith('998')) {
          setValue('+998' + digits);
        } else {
          setValue('+' + digits);
        }
      }
    }
  };
};
