import { useState, useRef, useEffect } from 'react';

export function useDropdown<T extends HTMLElement>() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<T | null>(null);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const closeDropdown = () => setDropdownOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return { dropdownOpen, toggleDropdown, closeDropdown, dropdownRef };
}