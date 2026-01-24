# 🎨 UI Components Library

Modern, professional va consistent UI komponentlar kutubxonasi.

## 📦 Komponentlar

### Button
```tsx
import { Button } from './components/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icon
<Button icon={<Plus />}>Add Item</Button>

// Loading state
<Button loading>Loading...</Button>
```

### Input
```tsx
import { Input } from './components/ui';
import { Search } from 'lucide-react';

// Basic
<Input label="Name" placeholder="Enter name" />

// With icon
<Input 
  label="Search" 
  icon={<Search className="w-4 h-4" />}
  iconPosition="left"
/>

// With error
<Input 
  label="Email" 
  error="Invalid email address"
/>
```

### Card
```tsx
import { Card } from './components/ui';

// Basic
<Card>Content here</Card>

// With hover effect
<Card hover>Hoverable card</Card>

// Different padding
<Card padding="sm">Small padding</Card>
<Card padding="md">Medium padding</Card>
<Card padding="lg">Large padding</Card>
<Card padding="none">No padding</Card>
```

### Badge
```tsx
import { Badge } from './components/ui';

// Variants
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
```

### Alert
```tsx
import { Alert } from './components/ui';

// Variants
<Alert variant="info">Info message</Alert>
<Alert variant="success">Success message</Alert>
<Alert variant="warning">Warning message</Alert>
<Alert variant="danger">Error message</Alert>

// With title
<Alert variant="info" title="Information">
  Detailed message here
</Alert>

// Dismissible
<Alert variant="success" onClose={() => console.log('closed')}>
  Dismissible alert
</Alert>
```

### Modal
```tsx
import { Modal } from './components/ui';
import { useState } from 'react';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)}
      title="Modal Title"
      size="md"
    >
      <p>Modal content here</p>
    </Modal>
  );
}
```

### Spinner
```tsx
import { Spinner } from './components/ui';

// Sizes
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />

// With color
<Spinner className="text-primary-600" />
```

### Icon
```tsx
import { Icon } from './components/ui';
import { Home } from 'lucide-react';

// Sizes
<Icon size="sm"><Home /></Icon>
<Icon size="md"><Home /></Icon>
<Icon size="lg"><Home /></Icon>

// Variants
<Icon variant="primary"><Home /></Icon>
<Icon variant="success"><Home /></Icon>
<Icon variant="danger"><Home /></Icon>
```

### ThemeToggle
```tsx
import { ThemeToggle } from './components/ui/ThemeToggle';

// Add to header/navbar
<ThemeToggle />
```

## 🎨 Rang Tizimi

```
Primary (Blue): Asosiy amallar
Secondary (Slate): Ikkinchi darajali
Success (Green): Muvaffaqiyat
Warning (Amber): Ogohlantirish
Danger (Red): Xavfli amallar
```

## 📏 O'lchamlar

```
sm: Kichik elementlar
md: O'rtacha (default)
lg: Katta elementlar
xl: Juda katta
```

## 🌙 Dark Mode

Barcha komponentlar dark mode ni qo'llab-quvvatlaydi:

```tsx
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## 📱 Responsive

Barcha komponentlar responsive va mobile-friendly.

## ♿ Accessibility

- Keyboard navigation
- ARIA labels
- Focus states
- Screen reader support
