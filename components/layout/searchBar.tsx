import { useState } from 'react';
import { FilterOptions, filterOptions } from '../../types/filter';
import { SearchBarProps } from '@/types/api';
import DropdownFilter from '../../components/layout/dropDownFilter';

const SearchBar: React.FC<SearchBarProps> = ({ 
  onFilterChange, 
  filters, 
  onSearch,
  isSearching 
}) => {
  const [showAuthorSearch, setShowAuthorSearch] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [author, setAuthor] = useState(''); 

  const handleSearch = () => {
    onSearch({ keyword, author }); // 傳遞關鍵字和撰寫者到外層的 onSearch 函數
  };

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
          value={keyword}
          className="w-full px-4 py-2 mt-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setKeyword(e.target.value)}
        />
        {showAuthorSearch && (
          <input
            type="text"
            placeholder="輸入教案撰寫者"
            value={author}
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setAuthor(e.target.value)}
          />
        )}
      </div>

      {/* DropdownFilter 篩選按鈕 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
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

      {/* 搜尋按鈕 */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-12 rounded-lg 
                   shadow-md transition duration-300 ease-in-out
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSearching ? '搜尋中...' : '搜尋'}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;