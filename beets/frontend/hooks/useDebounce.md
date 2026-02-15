# ⏱️ useDebounce Hook - Qidiruv Optimizatsiyasi

## Maqsad

Qiymatni yangilashni kechiktirish orqali ortiqcha API so'rovlar va render larni oldini olish.

## Joylashuv

`client/src/hooks/useDebounce.ts`

## Funksiya

### useDebounce<T>(value, delay)

Qiymatni debounce qiladi (kechiktiradi).

**Parametrlar:**
- `value` (T): Debounce qilinadigan qiymat
- `delay` (number, optional): Kechikish vaqti (ms), default: 300ms

**Qaytaradi:**
- Debounced qiymat

## Qanday Ishlaydi

1. Qiymat o'zgarganda timer boshlanadi
2. Timer tugashidan oldin qiymat yana o'zgarsa, timer qaytadan boshlanadi
3. Timer tugagandan keyin yangi qiymat qaytariladi

## Ishlatish

### Qidiruv Input
```typescript
import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';

function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // Faqat debounced qiymat o'zgarganda API ga so'rov
    if (debouncedSearch) {
      searchProducts(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Mahsulot qidirish..."
    />
  );
}
```

### Filtrlash
```typescript
function ProductList() {
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebounce(filter, 300);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(debouncedFilter.toLowerCase())
    );
  }, [products, debouncedFilter]);

  return (
    <>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ProductGrid products={filteredProducts} />
    </>
  );
}
```

### API So'rov
```typescript
function CustomerSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      try {
        const res = await api.get('/customers', {
          params: { search: debouncedQuery }
        });
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      }
    };

    searchCustomers();
  }, [debouncedQuery]);

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Mijoz qidirish..."
      />
      <CustomerList customers={results} />
    </>
  );
}
```

## Afzalliklari

### 1. API So'rovlarni Kamaytirish

**Debounce siz:**
```typescript
// Har bir belgi kiritilganda API ga so'rov
onChange={(e) => {
  searchProducts(e.target.value); // 10 ta belgi = 10 ta so'rov
}}
```

**Debounce bilan:**
```typescript
// Faqat yozish to'xtagandan keyin so'rov
const debouncedSearch = useDebounce(searchTerm, 500);
useEffect(() => {
  searchProducts(debouncedSearch); // 10 ta belgi = 1 ta so'rov
}, [debouncedSearch]);
```

### 2. Render larni Kamaytirish

**Debounce siz:**
```typescript
// Har bir belgi kiritilganda filtrlash
const filtered = products.filter(p => 
  p.name.includes(searchTerm) // Har safar render
);
```

**Debounce bilan:**
```typescript
// Faqat debounced qiymat o'zgarganda filtrlash
const debouncedSearch = useDebounce(searchTerm, 300);
const filtered = useMemo(() => 
  products.filter(p => p.name.includes(debouncedSearch)),
  [products, debouncedSearch] // Kamroq render
);
```

## Delay Vaqti

### Qidiruv (300-500ms)
```typescript
const debouncedSearch = useDebounce(searchTerm, 500);
```

### Filtrlash (200-300ms)
```typescript
const debouncedFilter = useDebounce(filter, 300);
```

### Validatsiya (500-1000ms)
```typescript
const debouncedEmail = useDebounce(email, 1000);
```

### Real-time (100-200ms)
```typescript
const debouncedValue = useDebounce(value, 100);
```

## Real Misollar

### Mahsulot Qidirish
```typescript
function ProductSearchModal() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearch) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get('/products', {
          params: { search: debouncedSearch }
        });
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedSearch]);

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Mahsulot qidirish..."
      />
      {loading && <Spinner />}
      <ProductList products={products} />
    </div>
  );
}
```

### Email Validatsiya
```typescript
function EmailInput() {
  const [email, setEmail] = useState('');
  const debouncedEmail = useDebounce(email, 1000);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const validateEmail = async () => {
      if (!debouncedEmail) {
        setIsValid(null);
        return;
      }

      try {
        const res = await api.post('/validate-email', { email: debouncedEmail });
        setIsValid(res.data.isValid);
      } catch (err) {
        setIsValid(false);
      }
    };

    validateEmail();
  }, [debouncedEmail]);

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {isValid === true && <span>✓ Email to'g'ri</span>}
      {isValid === false && <span>✗ Email noto'g'ri</span>}
    </div>
  );
}
```

### Avtomatik Saqlash
```typescript
function AutoSaveForm() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const debouncedData = useDebounce(formData, 2000);

  useEffect(() => {
    const autoSave = async () => {
      if (!debouncedData.name) return;

      try {
        await api.put('/products/draft', debouncedData);
        console.log('Auto-saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    };

    autoSave();
  }, [debouncedData]);

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </form>
  );
}
```

## Cleanup

useDebounce avtomatik cleanup qiladi:

```typescript
useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedValue(value);
  }, delay);

  // Cleanup - component unmount yoki value o'zgarganda
  return () => {
    clearTimeout(handler);
  };
}, [value, delay]);
```

## Muhim Eslatmalar

1. **Delay**: Qidiruv uchun 300-500ms optimal
2. **API So'rovlar**: Har doim debounce ishlatish
3. **Filtrlash**: Katta ro'yxatlar uchun debounce kerak
4. **Cleanup**: Hook avtomatik cleanup qiladi

## Bog'liq Modullar

- `utils/api.ts` - API so'rovlar
- `components/ProductSearchModal.tsx` - Qidiruv modal
- `pages/admin/Products.tsx` - Mahsulotlar sahifasi

## Best Practices

```typescript
// ✅ To'g'ri - debounce bilan qidiruv
const debouncedSearch = useDebounce(search, 500);
useEffect(() => {
  searchProducts(debouncedSearch);
}, [debouncedSearch]);

// ❌ Noto'g'ri - debounce siz qidiruv
useEffect(() => {
  searchProducts(search); // Har safar so'rov
}, [search]);

// ✅ To'g'ri - optimal delay
const debouncedSearch = useDebounce(search, 500); // 500ms

// ❌ Noto'g'ri - juda qisqa delay
const debouncedSearch = useDebounce(search, 50); // Juda tez

// ❌ Noto'g'ri - juda uzun delay
const debouncedSearch = useDebounce(search, 5000); // Juda sekin
```

## Performance

### Debounce siz
```
User yozadi: "m" → API so'rov
User yozadi: "ma" → API so'rov
User yozadi: "mah" → API so'rov
User yozadi: "mahs" → API so'rov
User yozadi: "mahsu" → API so'rov
User yozadi: "mahsul" → API so'rov
User yozadi: "mahsulo" → API so'rov
User yozadi: "mahsulot" → API so'rov

Jami: 8 ta so'rov
```

### Debounce bilan (500ms)
```
User yozadi: "mahsulot"
500ms kutadi...
API so'rov

Jami: 1 ta so'rov
```

**Natija**: 87.5% kamroq so'rov!

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should debounce value', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 500 } }
    );

    expect(result.current).toBe('test');

    // Qiymatni o'zgartirish
    rerender({ value: 'new value', delay: 500 });

    // Hali eski qiymat
    expect(result.current).toBe('test');

    // 500ms kutish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Yangi qiymat
    expect(result.current).toBe('new value');
  });
});
```
