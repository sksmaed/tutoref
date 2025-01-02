export const handleSelectAll = (
    options: string[],
    selectedOptions: string[],
    onFilterChange: (type: string, value: string) => void,
    filterType: string
  ) => {
    options.forEach((option) => {
      if (!selectedOptions.includes(option)) {
        onFilterChange(filterType, option);
      }
    });
  };
  
export const handleDeselectAll = (
  options: string[],
  selectedOptions: string[],
  onFilterChange: (type: string, value: string) => void,
  filterType: string
) => {
  options.forEach((option) => {
    if (selectedOptions.includes(option)) {
      onFilterChange(filterType, option);
    }
  });
};
  