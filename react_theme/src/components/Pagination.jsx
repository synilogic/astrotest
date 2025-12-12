import React, { useEffect, useState } from 'react'

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

const getPageNumbers = (currentPage, totalPages, maxButtons = 5) => {
  if (totalPages <= 1) return [1]
  const half = Math.floor(maxButtons / 2)
  let start = clamp(currentPage - half, 1, Math.max(totalPages - maxButtons + 1, 1))
  let end = Math.min(start + maxButtons - 1, totalPages)
  start = Math.max(1, end - maxButtons + 1)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  maxButtons,
}) => {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (pageSize || 10)))
  const safePage = clamp(currentPage || 1, 1, totalPages)
  const [buttonsToShow, setButtonsToShow] = useState(maxButtons || 5)

  useEffect(() => {
    if (maxButtons) return
    const compute = () => {
      const w = window.innerWidth
      if (w < 400) return 3
      if (w < 768) return 4
      return 5
    }
    const handler = () => setButtonsToShow(compute())
    handler()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [maxButtons])

  const pages = getPageNumbers(safePage, totalPages, buttonsToShow)
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endItem = Math.min(safePage * pageSize, totalItems)

  const goTo = (page) => {
    const next = clamp(page, 1, totalPages)
    if (next !== safePage) onPageChange?.(next)
  }

  const changeSize = (e) => {
    const nextSize = Number(e.target.value)
    onPageSizeChange?.(nextSize)
  }

  return (
    <div className="react-pagination">
      <div className="react-page-size">
        <label>
          Show
          <select value={pageSize} onChange={changeSize} className="react-page-size-select">
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          entries
        </label>
      </div>

      <div className="react-page-controls">
        <button
          className="react-page-btn"
          onClick={() => goTo(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages[0] > 1 && (
          <>
            <button className="react-page-btn" onClick={() => goTo(1)}>1</button>
            <span className="react-page-ellipsis">…</span>
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            className={`react-page-btn ${p === safePage ? 'active' : ''}`}
            onClick={() => goTo(p)}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            <span className="react-page-ellipsis">…</span>
            <button className="react-page-btn" onClick={() => goTo(totalPages)}>{totalPages}</button>
          </>
        )}
        <button
          className="react-page-btn"
          onClick={() => goTo(safePage - 1 + 2)}
          disabled={safePage === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <div className="react-page-info">
        {totalItems > 0 ? (
          <span>
            Showing {startItem}–{endItem} of {totalItems}
          </span>
        ) : (
          <span>No records</span>
        )}
      </div>
    </div>
  )
}

export default Pagination


