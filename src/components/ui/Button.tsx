import React from 'react';

interface ButtonProps {
  variant?: 'default' | 'large' | 'small';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  leftIcon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children, onClick,
  disabled = false,
  className = '',
  type = 'button',
  leftIcon = ''
}) => {
  const baseClasses = `rounded-lg transition-all duration-200 flex items-center justify-center hover:opacity-90 hover:cursor-pointer`;
  const variantClasses = {
    default: 'py-1.5 px-3',
    large: 'py-3 px-12 w-full sm:w-[378px]',
    small: 'py-3 px-12 w-[170px]',
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
          <img
            src={leftIcon}
            alt="button icon"
            width={20}
            height={20}
            style={iconStyle}
            className="shrink-0"
          />
        )}
        <span>{children}</span>
      </span>
    </button>
  );
};