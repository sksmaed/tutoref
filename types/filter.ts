// 定義篩選條件的結構
export interface FilterOptions {
  team: string[];
  semester: string[];
  category: string[];
  grade: string[];
  duration: string[];
}
  
// 初始篩選條件
export const initialFilters: FilterOptions = {
  team: [],
  semester: [],
  category: [],
  grade: [],
  duration: [],
};
  
// 篩選選項
export const filterOptions: FilterOptions = {
  team: ['加拿', '初來', '新武', '霧鹿', '利稻'],
  semester: ['23冬', '23夏', '24冬', '24夏', '25冬'],
  category: ['自然', '社會', '綜合', '資訊', '藝文', '國語', '健教', '晨讀', '英文'],
  grade: ['全年級', '低年級', '中年級', '高年級', '中低年級', '中高年級'],
  duration: ['大堂課（90分鐘）', '小堂課（40分鐘）'],
};

export interface DropdownFilterProps {
  filterType: string;
  options: string[];
  selectedOptions: string[];
  onFilterChange: (type: string, value: string) => void;
}