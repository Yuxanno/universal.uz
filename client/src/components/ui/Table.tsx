import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
}

/**
 * Table Component - Professional Data Table
 * 
 * Features:
 * - Responsive (desktop table, mobile cards)
 * - Loading states
 * - Empty states
 * - Row click handler
 * - Custom cell rendering
 * - Proper alignment
 * 
 * Usage:
 * <Table
 *   data={products}
 *   columns={[
 *     { key: 'name', label: 'Mahsulot nomi', align: 'left' },
 *     { key: 'price', label: 'Narxi', align: 'right', render: (item) => formatNumber(item.price) }
 *   ]}
 *   keyExtractor={(item) => item._id}
 *   onRowClick={(item) => handleEdit(item)}
 * />
 */
export default function Table<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyState
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="skeleton w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-title" />
              <div className="skeleton-text w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState || (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">Ma'lumot topilmadi</p>
      </div>
    );
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={`
                      px-6 py-4 text-sm font-semibold text-gray-900
                      ${alignClasses[column.align || 'left']}
                    `}
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(item => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    transition-colors
                    hover:bg-gray-50
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`
                        px-6 py-4 text-sm text-gray-900
                        ${alignClasses[column.align || 'left']}
                      `}
                    >
                      {column.render 
                        ? column.render(item) 
                        : (item as any)[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {data.map(item => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white rounded-xl p-4 border border-gray-200
              transition-all duration-200
              ${onRowClick ? 'cursor-pointer active:scale-98' : ''}
            `}
          >
            {columns.map(column => (
              <div key={column.key} className="flex justify-between items-start py-2">
                <span className="text-sm font-medium text-gray-500">
                  {column.label}
                </span>
                <span className="text-sm text-gray-900 text-right ml-4">
                  {column.render 
                    ? column.render(item) 
                    : (item as any)[column.key]
                  }
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
