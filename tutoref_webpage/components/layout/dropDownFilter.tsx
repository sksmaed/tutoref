import { DropdownFilterProps } from '@/types/filter';
import { useDropdown } from '@/hooks/useDropdown';
import { handleSelectAll, handleDeselectAll } from '@/lib/filterHelpers';
import { FILTER_TYPE_MAP } from '@/lib/constant';

export default function DropdownFilter({
  filterType,
  options,
  selectedOptions,
  onFilterChange,
}: DropdownFilterProps) {
  const { dropdownOpen, toggleDropdown, dropdownRef } = useDropdown<HTMLDivElement>();

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={toggleDropdown}
        className="w-full px-4 py-2 bg-gray-100 rounded-md border text-gray-700 focus:outline-none hover:bg-gray-200"
      >
        選擇{FILTER_TYPE_MAP[filterType] || filterType} {selectedOptions.length > 0 && <span>({selectedOptions.length}個)</span>}
      </button>
      {dropdownOpen && (
        <div className="absolute mt-2 bg-white border rounded-md shadow-md z-10 w-full">
          {/* 全選與全部不選 */}
          <div className="flex justify-between px-4 py-2 bg-gray-100 border-b">
            <button
              className="text-blue-600 hover:underline"
              onClick={() => handleSelectAll(options, selectedOptions, onFilterChange, filterType)}
            >
              全選
            </button>
            <button
              className="text-red-600 hover:underline"
              onClick={() => handleDeselectAll(options, selectedOptions, onFilterChange, filterType)}
            >
              清除全部
            </button>
          </div>

          {/* 選項列表 */}
          {options.map((option) => (
            <label
              key={option}
              className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedOptions.includes(option)}
                onChange={() => onFilterChange(filterType, option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}