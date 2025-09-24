import React, { useState } from 'react';
import Image from 'next/image';

type InputState = 'default' | 'disabled' | 'entered' | 'error';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'file';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onChangeFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  state?: InputState;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  showPasswordToggle?: boolean;
  multiple?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onChangeFile,
  onBlur,
  state,
  disabled = false,
  error = false,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconClick,
  showPasswordToggle = false,
  multiple = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getState = (): InputState => {
    if (state) return state;
    if (disabled) return 'disabled';
    if (error) return 'error';
    if (value && value.length > 0) return 'entered';
    return 'default';
  };
  const currentState = getState();
  const inputType = type === 'password' && showPassword ? 'text' : type;

  const getInputStyles = () => {
    const baseStyles = 'w-full border-none outline-hidden bg-transparent';

    const stateStyles = {
      default: 'text-black-500 placeholder:text-black-300',
      disabled: 'text-black-300 placeholder:text-black-200 cursor-not-allowed',
      entered: 'text-black-900 placeholder:text-black-300',
      error: 'text-black-900 placeholder:text-black-300'
    };

    return `${baseStyles} ${stateStyles[currentState]}`;
  };

  const getContainerStyles = () => {
    const baseStyles = 'w-full flex items-center rounded-lg px-4 py-3 gap-2.5';

    const stateStyles = {
      default: 'border border-black-200 bg-white',
      disabled: 'border border-black-100 bg-gray-50',
      entered: 'border-2 border-black-200 bg-white',
      error: 'border-2 border-error-border bg-white'
    };

    return `${baseStyles} ${stateStyles[currentState]}`;
  };

  const getIconColor = () => {
    if (currentState === 'disabled') return 'opacity-40';
    return '';
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full flex flex-col gap-1">
      <div className={getContainerStyles()}>
        {leftIcon && (
          <div className={`${getIconColor()}`}>
            <Image
              src={leftIcon}
              alt="left icon"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
        )}

        <input
          type={inputType}
          value={type === 'file' ? undefined : value}
          onChange={(e) => {
            if (type === 'file' && onChangeFile) {
              onChangeFile(e);
            } else {
              onChange(e.target.value);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.();
          }}
          disabled={disabled}
          multiple={type === 'file' ? multiple : undefined}
          className={getInputStyles()}
          placeholder={placeholder}
        />

        {(rightIcon || showPasswordToggle) && (
          <div className='flex items-center'>
            {showPasswordToggle && type === 'password' ? (
              <button
                type="button"
                onClick={handlePasswordToggle}
                disabled={disabled}
                className={`${getIconColor()} disabled:cursor-not-allowed hover:cursor-pointer`}
              >
                {showPassword ? (
                  <Image
                    src="/icons/eye-open.png"
                    alt="hide password"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                ) : (
                  <Image
                    src="/icons/eye-closed.png"
                    alt="show password"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                )}
              </button>
            ) : rightIcon ? (
              <button
                type="button"
                onClick={onRightIconClick}
                disabled={disabled || !onRightIconClick}
                className={`${getIconColor()} disabled:cursor-not-allowed ${!onRightIconClick ? 'cursor-default' : 'hover:cursor-pointer'
                  }`}
              >
                <Image
                  src={rightIcon}
                  alt="right icon"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </button>
            ) : null}
          </div>
        )}
      </div>

      {currentState === 'error' && errorMessage && (
        <p className="pl-3 text-xs/normal font-normal text-error-border">{errorMessage}</p>
      )}
    </div>
  );
};