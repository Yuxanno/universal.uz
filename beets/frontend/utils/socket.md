# 🔌 Socket.IO Client - Real-time Aloqa

## Maqsad

Backend bilan real-time aloqa o'rnatish va ma'lumotlarni darhol yangilash.

## Joylashuv

`client/src/utils/socket.ts`

## Funksiyalar

### initSocket()

Socket connection yaratadi yoki mavjud connectionni qaytaradi.

**Qaytaradi:**
- Socket instance

**Misol:**
```typescript
import { initSocket } from '../utils/socket';

const socket = initSocket();
```

### getSocket()

Mavjud socket instanceni qaytaradi.

**Qaytaradi:**
- Socket instance yoki null

**Misol:**
```typescript
import { getSocket } from '../utils/socket';

const socket = getSocket();
if (socket) {
  socket.emit('message', data);
}
```

### disconnectSocket()

Socket connectionni yopadi.

**Misol:**
```typescript
import { disconnectSocket } from '../utils/socket';

disconnectSocket();
```

## Socket URL

URL avtomatik aniqlanadi:

```typescript
const getSocketURL = () => {
  // Production
  if (window.location.hostname === 'pos.universalbozor.uz') {
    return 'https://pos.universalbozor.uz';
  }
  // Development
  return 'http://localhost:5050';
};
```

## Konfiguratsiya

```typescript
const socket = io(SOCKET_URL, {
  autoConnect: true,           // Avtomatik ulanish
  reconnection: true,          // Qayta ulanish
  reconnectionDelay: 1000,     // 1 soniya kutish
  reconnectionAttempts: 5      // 5 marta urinish
});
```

## Events

### Connection Events

```typescript
// Ulanganda
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

// Uzilganda
socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

// Xato
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Custom Events

Backend dan kelgan eventlar:

```typescript
// Mahsulot yangilandi
socket.on('product-updated', (product) => {
  console.log('Product updated:', product);
  updateProduct(product);
});

// Inventar yangilandi
socket.on('inventory:updated', () => {
  console.log('Inventory updated');
  refreshProducts();
});

// Qarz yangilandi
socket.on('debt-updated', (debt) => {
  console.log('Debt updated:', debt);
  updateDebt(debt);
});

// Yangi chek
socket.on('receipt-created', (receipt) => {
  console.log('New receipt:', receipt);
  addReceipt(receipt);
});
```

## Ishlatish

### App.tsx da Initsializatsiya
```typescript
import { useEffect } from 'react';
import { initSocket } from './utils/socket';

function App() {
  useEffect(() => {
    console.log('Initializing socket...');
    initSocket();

    return () => {
      console.log('App unmounting, keeping socket alive');
    };
  }, []);

  return <div>...</div>;
}
```

### Context da Ishlatish
```typescript
import { useEffect } from 'react';
import { getSocket } from '../utils/socket';

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleInventoryUpdate = () => {
      console.log('Inventory updated, refreshing...');
      fetchProducts(true);
    };

    socket.on('inventory:updated', handleInventoryUpdate);

    return () => {
      socket.off('inventory:updated', handleInventoryUpdate);
    };
  }, []);

  return <ProductsContext.Provider value={...}>...</ProductsContext.Provider>;
}
```

### Component da Ishlatish
```typescript
import { useEffect } from 'react';
import { getSocket } from '../utils/socket';

function DebtList() {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDebtUpdate = (updatedDebt) => {
      setDebts(prev => 
        prev.map(d => d._id === updatedDebt._id ? updatedDebt : d)
      );
    };

    socket.on('debt-updated', handleDebtUpdate);

    return () => {
      socket.off('debt-updated', handleDebtUpdate);
    };
  }, []);

  return <div>...</div>;
}
```

## Event Emit (Yuborish)

```typescript
import { getSocket } from '../utils/socket';

function sendMessage() {
  const socket = getSocket();
  if (!socket) return;

  socket.emit('custom-event', {
    message: 'Hello from client'
  });
}
```

## Real Misollar

### Mahsulot Yangilanishi
```typescript
// ProductsContext.tsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const handleInventoryUpdate = () => {
    console.log('📦 Inventory updated, refreshing products...');
    fetchProducts(true); // Force refresh
  };

  socket.on('inventory:updated', handleInventoryUpdate);

  return () => {
    socket.off('inventory:updated', handleInventoryUpdate);
  };
}, [fetchProducts]);
```

### Qarz To'lovi
```typescript
// DebtsContext.tsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const handleDebtUpdate = (updatedDebt) => {
    console.log('💰 Debt updated:', updatedDebt);
    
    setDebts(prev => 
      prev.map(debt => 
        debt._id === updatedDebt._id ? updatedDebt : debt
      )
    );
  };

  socket.on('debt-updated', handleDebtUpdate);

  return () => {
    socket.off('debt-updated', handleDebtUpdate);
  };
}, []);
```

### Yangi Chek
```typescript
// ReceiptsContext.tsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const handleNewReceipt = (receipt) => {
    console.log('🧾 New receipt created:', receipt);
    
    setReceipts(prev => [receipt, ...prev]);
    showToast('Yangi chek yaratildi', 'info');
  };

  socket.on('receipt-created', handleNewReceipt);

  return () => {
    socket.off('receipt-created', handleNewReceipt);
  };
}, []);
```

## Cleanup

Har doim cleanup qilish kerak:

```typescript
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const handler = (data) => {
    console.log('Event received:', data);
  };

  socket.on('custom-event', handler);

  // Cleanup
  return () => {
    socket.off('custom-event', handler);
  };
}, []);
```

## Reconnection

Socket avtomatik qayta ulanadi:

```typescript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Ma'lumotlarni qayta yuklash
  refreshData();
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed');
  showToast('Server bilan aloqa yo\'q', 'error');
});
```

## Muhim Eslatmalar

1. **Singleton Pattern**: Faqat bitta socket instance yaratiladi
2. **Cleanup**: Har doim `socket.off()` qilish kerak
3. **Null Check**: `getSocket()` null qaytarishi mumkin
4. **Reconnection**: Avtomatik qayta ulanish yoqilgan

## Bog'liq Modullar

- `context/ProductsContext.tsx` - Mahsulotlar yangilanishi
- `context/CustomersContext.tsx` - Mijozlar yangilanishi
- `App.tsx` - Socket initsializatsiyasi

## Best Practices

```typescript
// ✅ To'g'ri - cleanup bilan
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const handler = (data) => console.log(data);
  socket.on('event', handler);

  return () => {
    socket.off('event', handler);
  };
}, []);

// ❌ Noto'g'ri - cleanup yo'q
useEffect(() => {
  const socket = getSocket();
  socket.on('event', (data) => console.log(data));
}, []);

// ✅ To'g'ri - null check
const socket = getSocket();
if (socket) {
  socket.emit('event', data);
}

// ❌ Noto'g'ri - null check yo'q
const socket = getSocket();
socket.emit('event', data); // Error!

// ✅ To'g'ri - App.tsx da init
useEffect(() => {
  initSocket();
}, []);

// ❌ Noto'g'ri - har bir component da init
useEffect(() => {
  initSocket(); // Ortiqcha
}, []);
```

## Debugging

```typescript
// Socket holatini tekshirish
const socket = getSocket();
console.log('Socket connected:', socket?.connected);
console.log('Socket ID:', socket?.id);

// Barcha listenerlarni ko'rish
console.log('Listeners:', socket?.listeners('event'));

// Eventlarni log qilish
socket?.onAny((eventName, ...args) => {
  console.log('Event:', eventName, args);
});
```

## Testing

```typescript
import { initSocket, getSocket, disconnectSocket } from './socket';

describe('Socket', () => {
  afterEach(() => {
    disconnectSocket();
  });

  it('should create socket instance', () => {
    const socket = initSocket();
    expect(socket).toBeDefined();
    expect(socket.connected).toBe(true);
  });

  it('should reuse existing socket', () => {
    const socket1 = initSocket();
    const socket2 = initSocket();
    expect(socket1).toBe(socket2);
  });

  it('should disconnect socket', () => {
    initSocket();
    disconnectSocket();
    const socket = getSocket();
    expect(socket).toBeNull();
  });
});
```

## Backend Integration

Backend da socket emit qilish:

```javascript
// server/src/routes/products.js
router.put('/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body);
  
  // Barcha clientlarga xabar yuborish
  global.io.emit('product-updated', product);
  
  res.json({ success: true, data: product });
});
```
