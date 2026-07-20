import React from 'react';
import { Checkbox } from './Checkbox';

interface RadioCheckboxGroupProps {
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

const RadioCheckboxGroup: React.FC<RadioCheckboxGroupProps> = ({
  options,
  selectedValue,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(option => (
        <Checkbox
          key={option}
          checked={selectedValue === option}
          onChange={(checked) => {
            if (checked) {
              onChange(option);
            }
          }}
          label={option}
          className="text-sm"
        />
      ))}
    </div>
  );
};

export default RadioCheckboxGroup;
