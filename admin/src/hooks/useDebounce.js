import { useState, useEffect } from 'react';

/**
 * Debounce mot gia tri — chi cap nhat sau khi ngung thay doi `delay` ms.
 * Dung cho search input de tranh goi API moi keystroke.
 *
 * @param {*} value  - Gia tri can debounce
 * @param {number} delay - Thoi gian cho (ms), mac dinh 400ms
 * @returns Gia tri da debounce
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
