import { useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  error?: string | null
  pageSize?: number
  onRowClick?: (item: T) => void
}

export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  error = null,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<keyof T | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter data
  let filteredData = data
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredData = data.filter((item) =>
      columns.some((col) => {
        if (!col.searchable) return false
        const value = String(item[col.key]).toLowerCase()
        return value.includes(term)
      })
    )
  }

  // Sort data
  if (sortBy) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string)
      }

      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      }

      return 0
    })
  }

  // Paginate
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: keyof T) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
    setPage(0)
  }

  const searchableColumns = columns.filter((c) => c.searchable)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="text-center text-gray-500 py-12">No data available</p>
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchableColumns.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${searchableColumns.map((c) => c.label).join(', ')}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <div className="w-4 h-4">
                        {sortBy === col.key && (
                          sortOrder === 'asc' ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr
                key={item.id || idx}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4">
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-2 py-2 rounded-lg text-sm font-medium ${
                    page === i
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
