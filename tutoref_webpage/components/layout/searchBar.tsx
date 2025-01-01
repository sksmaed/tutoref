import { useState } from 'react';
import { FilterOptions, filterOptions } from '../../types/filter';
import DropdownFilter from '../../components/layout/dropDownFilter';

interface SearchBarProps {
  onFilterChange: (type: string, value: string) => void;
  filters: FilterOptions;
}

const SearchBar: React.FC<SearchBarProps> = ({ onFilterChange, filters }) => {
  const [showAuthorSearch, setShowAuthorSearch] = useState(false);
  return (
    <div className="bg-white shadow-md p-6 rounded-lg">
      {/* 搜索欄 */}
      <div className="mb-4 relative">
        <button
          onClick={() => setShowAuthorSearch(!showAuthorSearch)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md focus:outline-none hover:bg-blue-700"
        >
          搜尋撰寫者
        </button>
        <input
          type="text"
          placeholder="輸入關鍵字"
          className="w-full px-4 py-2 mt-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showAuthorSearch && (
              <input
                type="text"
                placeholder="輸入教案撰寫者"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
      </div>

      {/* DropdownFilter 篩選按鈕 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.keys(filters).map((filterType) => (
          <DropdownFilter
            key={filterType}
            filterType={filterType}
            options={filterOptions[filterType as keyof FilterOptions]}
            selectedOptions={filters[filterType as keyof FilterOptions]}
            onFilterChange={onFilterChange}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
