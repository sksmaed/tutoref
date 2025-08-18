import React from 'react';
import Image from 'next/image';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    label,
    className = ''
}) => {
    return (
        <label className={`flex items-center ${className} gap-1.5 cursor-pointer`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
                <div className="w-5 h-5 flex items-center justify-center">
                    <Image
                        src={checked ? "/icons/checked.png" : "/icons/uncheck.png"}
                        alt={checked ? "checked" : "unchecked"}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                    />
                </div>
            </div>
            <span className="text-base text-black-900">{label}</span>
        </label>
    );
};