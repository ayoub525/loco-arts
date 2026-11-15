import clsx from 'clsx'

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  let start = Math.max(1, currentPage - delta)
  let end = Math.min(totalPages, currentPage + delta)

  if (currentPage - delta > 1) pages.push(1, '...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (currentPage + delta < totalPages) pages.push('...', totalPages)

  return (
    <nav
      className={clsx('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 hover:border-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Précédent
      </button>

      {/* Pages */}
      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              'w-10 h-10 text-sm border transition-colors',
              page === currentPage
                ? 'bg-black text-white border-black'
                : 'border-gray-200 hover:border-black'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 hover:border-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        Suivant
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
