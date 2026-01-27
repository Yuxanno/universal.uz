import re

# Read the file
with open('client/src/pages/cashier/Products.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove onTransfer from ProductRow props
content = re.sub(r',?\s*onTransfer,?\s*', '', content)

# Remove transfer button from ProductRow (lines with ArrowRightLeft in actions)
content = re.sub(
    r'<button onClick=\{\(\) => onTransfer\(product\)\}[^>]*title="Omborga o\'tkazish">\s*<ArrowRightLeft[^/]*/>\s*</button>\s*',
    '',
    content,
    flags=re.DOTALL
)

# Remove transfer button from ProductCard
content = re.sub(
    r'<button onClick=\{\(\) => onTransfer\(product\)\}[^>]*>\s*<ArrowRightLeft[^/]*/>\s*Transfer\s*</button>\s*',
    '',
    content,
    flags=re.DOTALL
)

# Remove transfer-related state variables
content = re.sub(r'\s*const \[showTransferModal, setShowTransferModal\] = useState\(false\);', '', content)
content = re.sub(r'\s*const \[transferProduct, setTransferProduct\] = useState<Product \| null>\(null\);', '', content)
content = re.sub(r'\s*const \[transferToWarehouse, setTransferToWarehouse\] = useState\(\'\'\);', '', content)
content = re.sub(r'\s*const \[transferQuantity, setTransferQuantity\] = useState\(\'\'\);', '', content)
content = re.sub(r'\s*const \[warehouses, setWarehouses\] = useState<Warehouse\[\]>\(\[\]\);', '', content)

# Remove fetchWarehouses function call from fetchMainWarehouse
content = re.sub(r'setWarehouses\(res\.data\);', '', content)
content = re.sub(r'setWarehouses\(\[\.\.\.res\.data, newMain\.data\]\);', '', content)

# Remove setShowTransferModal(false) calls
content = re.sub(r'\s*setShowTransferModal\(false\);', '', content)

# Remove onTransfer prop from ProductRow/ProductCard calls
content = re.sub(r'\s*onTransfer=\{openTransferModal\}', '', content)

# Remove ArrowRightLeft from imports
content = re.sub(r',\s*ArrowRightLeft', '', content)

# Write back
with open('client/src/pages/cashier/Products.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Transfer code removed successfully!")
