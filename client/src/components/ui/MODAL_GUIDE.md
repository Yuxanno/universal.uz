# Modal Dizayn Guide

Loyihadagi barcha modallar uchun mukammal dizayn qo'llanmasi.

## 🎨 Standart Modal Dizayni

### Asosiy Struktura

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Overlay */}
  <div 
    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
    onClick={onClose}
  />
  
  {/* Modal */}
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Modal Title</h3>
            <p className="text-sm text-white/80">Subtitle</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* Your content here */}
    </div>

    {/* Footer (optional) */}
    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
      {/* Footer buttons */}
    </div>
  </div>
</div>
```

## 🎯 Rang Variantlari

### Header Gradientlari

```tsx
// Blue (default)
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Green (success)
className="bg-gradient-to-r from-green-600 to-emerald-600"

// Red (danger)
className="bg-gradient-to-r from-red-600 to-rose-600"

// Orange (warning)
className="bg-gradient-to-r from-orange-600 to-amber-600"

// Purple
className="bg-gradient-to-r from-purple-600 to-indigo-600"
```

## 🎨 Iconlar

Lucide React iconlaridan foydalaning:

```tsx
import { 
  Package, 
  Search, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Building2,
  MessageSquare,
  FileText,
  BarChart3,
  Hash,
  Layers
} from 'lucide-react';

// Icon ishlatish
<Package className="w-6 h-6 text-white" />
<Search className="w-5 h-5 text-gray-400" />
```

## 📏 O'lchamlar

```tsx
// Small
max-w-md

// Medium (default)
max-w-lg

// Large
max-w-2xl

// Extra Large
max-w-4xl

// Full
max-w-[95vw]
```

## ✨ Animatsiyalar

CSS animatsiyalari (index.css da mavjud):
- `animate-fadeIn` - overlay uchun
- `animate-scaleIn` - modal uchun

## 🎨 Dizayn Qoidalari

### 1. Overlay
- `bg-black/60` - 60% qora rang
- `backdrop-blur-sm` - blur effekt
- Click qilganda yopilishi kerak

### 2. Header
- Gradient background
- Oq matn
- Icon + Title + Subtitle
- Close button (o'ng tomonda)

### 3. Content
- Oq fon
- `p-6` padding
- `overflow-y-auto` scroll uchun
- `flex-1` - to'liq balandlik

### 4. Footer (ixtiyoriy)
- `border-t` - yuqorida border
- `bg-gray-50` - kulrang fon
- Tugmalar o'ng tomonda

## 🔧 EnhancedModal Komponenti

Tayyor komponent ishlatish:

```tsx
import { EnhancedModal } from '@/components/ui';

<EnhancedModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  subtitle="Optional subtitle"
  size="lg"
  headerColor="blue"
  footer={
    <div className="flex justify-end gap-2">
      <button className="btn-secondary">Bekor qilish</button>
      <button className="btn-primary">Saqlash</button>
    </div>
  }
>
  {/* Your content */}
</EnhancedModal>
```

## 📱 Responsive

```tsx
// Mobile
p-4 // padding
max-h-[90vh] // max height

// Desktop
lg:p-6 // larger padding
lg:max-w-4xl // larger width
```

## ⌨️ Keyboard Support

ESC tugmasi bilan yopilishi kerak:

```tsx
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [isOpen, onClose]);
```

## 🎯 Best Practices

1. ✅ Har doim overlay qo'shing
2. ✅ Close button qo'shing
3. ✅ ESC tugmasi support
4. ✅ Gradient header ishlatish
5. ✅ Oq matn header'da
6. ✅ Qora matn content'da
7. ✅ Smooth animations
8. ✅ Responsive dizayn
9. ✅ Max height belgilang
10. ✅ Overflow scroll qo'shing

## 🚫 Qilmaslik Kerak

1. ❌ Oq matn oq fonda
2. ❌ Juda katta modallar
3. ❌ Scroll yo'q
4. ❌ Close button yo'q
5. ❌ Animatsiya yo'q
6. ❌ Dark mode support yo'q
7. ❌ Responsive emas
8. ❌ ESC support yo'q

## 📝 Misol: Search Modal

```tsx
{showSearch && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      onClick={() => setShowSearch(false)}
    />
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mahsulot qidirish</h3>
              <p className="text-sm text-white/80">Nom yoki kod bilan</p>
            </div>
          </div>
          <button
            onClick={() => setShowSearch(false)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Results here */}
      </div>
    </div>
  </div>
)}
```

## 🎨 Tugmalar

```tsx
// Primary
className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold"

// Secondary
className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"

// Danger
className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 font-semibold"
```

---

Bu qo'llanma barcha modallar uchun standart dizayn yaratishga yordam beradi!
