import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5; // standard centered range

    if (totalPages <= maxButtons + 4) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let start = Math.max(2, page - 2);
      let end = Math.min(totalPages - 1, page + 2);

      if (page <= 3) {
        end = maxButtons;
      } else if (page >= totalPages - 2) {
        start = totalPages - maxButtons + 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination">
      <button
        className="pagination-btn arrow"
        disabled={page === 1}
        onClick={() => onPageChange(1)}
        title="Trang đầu"
      >
        «
      </button>
      <button
        className="pagination-btn arrow"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        title="Trang trước"
      >
        ‹
      </button>

      {pages.map((p, index) => {
        if (p === '...') {
          return (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          );
        }
        return (
          <button
            key={p}
            className={`pagination-btn ${page === p ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        );
      })}

      <button
        className="pagination-btn arrow"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        title="Trang sau"
      >
        ›
      </button>
      <button
        className="pagination-btn arrow"
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
        title="Trang cuối"
      >
        »
      </button>
    </div>
  );
}
