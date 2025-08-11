import React from 'react';
import Image from 'next/image';

interface ButtonProps {
  variant?: 'large' | 'small';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  leftIcon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'large',
  children, onClick,
  disabled = false,
  className = '',
  type = 'button',
  leftIcon = ''
}) => {
  const baseClasses = `py-3 px-12 rounded-lg transition-all duration-200 flex items-center justify-center hover:opacity-90`;
  const variantClasses = {
    large: 'w-[378px]',
    small: 'w-[160px]',
  };
  const iconStyle: React.CSSProperties = {
    width: 20,
    height: 20,
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'bg-black-200 cursor-not-allowed' : ''} ${className}`}
    >
      <span className="flex items-center justify-center gap-2">
        {leftIcon && (
          <Image
            src={leftIcon}
            alt="button icon"
            width={20}
            height={20}
            style={iconStyle}
            className="flex-shrink-0"
          />
        )}
        <span>{children}</span>
      </span>
    </button>
  );
};