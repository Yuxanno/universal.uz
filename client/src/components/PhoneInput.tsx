import { Phone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  placeholder = '+998 (XX) XXX-XX-XX',
  required = false,
  className = '',
  disabled = false
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value || '+998');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value || value.trim() === '') {
      setDisplayValue('+998');
    } else {
      // Extract only digits from value
      const digits = value.replace(/\D/g, '');
      if (digits.startsWith('998')) {
        setDisplayValue(formatPhone(digits));
      } else {
        setDisplayValue('+998');
      }
    }
  }, [value]);

  const formatPhone = (digits: string): string => {
    if (digits.length <= 3) return '+998';
    
    const phone = digits.slice(0, 12);
    const rest = phone.slice(3);
    
    let formatted = '+998';
    if (rest.length > 0) {
      formatted += ' (' + rest.slice(0, 2);
      if (rest.length >= 2) {
        formatted += ') ' + rest.slice(2, 5);
        if (rest.length >= 5) {
          formatted += '-' + rest.slice(5, 7);
          if (rest.length >= 7) {
            formatted += '-' + rest.slice(7, 9);
          }
        }
      }
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Faqat raqamlarni olish
    const digits = input.replace(/\D/g, '');
    
    // Agar 998 dan kam bo'lsa, +998 qoldirish
    if (digits.length < 3 || !digits.startsWith('998')) {
      setDisplayValue('+998');
      onChange('+998');
      return;
    }
    
    // Maksimal 12 ta raqam (998 + 9 ta raqam)
    const phone = digits.slice(0, 12);
    const formatted = formatPhone(phone);
    
    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    const currentValue = input.value;
    
    // Backspace bosilganda
    if (e.key === 'Backspace') {
      // Agar cursor +998 ichida bo'lsa, oldini olish
      if (cursorPosition <= 4) {
        e.preventDefault();
        return;
      }
      
      // Agar butun matn tanlangan bo'lsa
      if (input.selectionStart === 0 && input.selectionEnd === currentValue.length) {
        e.preventDefault();
        setDisplayValue('+998');
        onChange('+998');
        return;
      }
      
      // Agar cursor formatlash belgisida bo'lsa (qavs, chiziq, bo'sh joy)
      const charBefore = currentValue[cursorPosition - 1];
      if (charBefore && /[\s\(\)\-]/.test(charBefore)) {
        e.preventDefault();
        // Raqamni o'chirish
        const digits = currentValue.replace(/\D/g, '');
        if (digits.length > 3) {
          const newDigits = digits.slice(0, -1);
          const formatted = formatPhone(newDigits);
          setDisplayValue(formatted);
          onChange(formatted);
        }
        return;
      }
    }
    
    // Delete bosilganda
    if (e.key === 'Delete') {
      // Agar cursor +998 ichida bo'lsa, oldini olish
      if (cursorPosition < 4) {
        e.preventDefault();
        return;
      }
      
      // Agar cursor formatlash belgisida bo'lsa
      const charAfter = currentValue[cursorPosition];
      if (charAfter && /[\s\(\)\-]/.test(charAfter)) {
        e.preventDefault();
        return;
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    
    // Agar cursor +998 ichida bo'lsa, +998 dan keyingi birinchi pozitsiyaga o'tkazish
    if (cursorPosition < 4) {
      setTimeout(() => {
        input.setSelectionRange(4, 4);
      }, 0);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Phone className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="input pl-12"
      />
    </div>
  );
}
