# Receipt Centering & Admin Sidebar Update

## Changes Made

### 1. Receipt Text Centering (Kassa.tsx)
**File**: `universal.uz/client/src/pages/admin/Kassa.tsx`

Updated the print receipt CSS to center all text sections:

- **Title**: Already centered, kept as is
- **Contacts grid**: Changed from `text-align: left` to `text-align: center`
- **Contact items**: Added `text-align: center`
- **Meta info** (Sana, Chek): Changed from `text-align: left` to `text-align: center`
- **Items section**: Changed from `text-align: left` to `text-align: center`
- **Item names**: Added `text-align: center`
- **Item calculations**: Kept flex layout but centered parent
- **Total box**: Already centered
- **Payment method**: Added `text-align: center`

All receipt text is now centered for better visual appearance on 58mm thermal printers.

### 2. Admin Sidebar Menu Items (Sidebar.tsx)
**File**: `universal.uz/client/src/components/Sidebar.tsx`

Added two new menu items to `adminMenuItems`:

1. **Kassa** - Added after "Statistika"
   - Icon: `ShoppingCart`
   - Path: `/admin/kassa`
   - Label: "Kassa"

2. **Xodimlar cheklari** - Added after "Buyurtmalar"
   - Icon: `Receipt`
   - Path: `/admin/staff-receipts`
   - Label: "Xodimlar cheklari"

Admin sidebar now matches the cashier sidebar functionality, giving admins access to:
- Kassa (POS) system
- Staff receipts management

## Updated Admin Menu Order
1. Statistika
2. **Kassa** ← NEW
3. Tovarlar
4. Omborlar
5. Mijozlar
6. Qarz daftarcha
7. Buyurtmalar
8. **Xodimlar cheklari** ← NEW
9. Yordamchilar

## Testing
- No TypeScript errors
- All imports are correct
- Menu items follow the same pattern as existing items
- Receipt CSS maintains all existing functionality while centering text

## Notes
- Receipt contacts grid uses 2-column layout but now centered
- Item calculations still use flexbox for price alignment but parent is centered
- All changes are backward compatible
- No breaking changes to existing functionality
