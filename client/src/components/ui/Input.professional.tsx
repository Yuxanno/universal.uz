/**
 * 🎨 Professional Input Component
 * Accessible, beautiful, and feature-rich
 */

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Search, X } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'error' | 'success';

interface BaseInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

const iconSizeStyles: Record<InputSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Input = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const state: InputState = error ? 'error' : success ? 'success' : 'default';

    const stateStyles = {
      default: 'border-gray-200 focus:border-red-500 focus:ring-red-500/20',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500/20',
    };

    const baseInputStyles = `
      w-full
      bg-white
      border-2
      rounded-lg
      text-gray-900
      placeholder:text-gray-400
      transition-all duration-200
      focus:outline-none focus:ring-4
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `;

    const paddingStyles = leftIcon
      ? size === 'sm'
        ? 'pl-10'
        : size === 'md'
        ? 'pl-12'
        : 'pl-14'
      : '';

    const rightPaddingStyles = rightIcon
      ? size === 'sm'
        ? 'pr-10'
        : size === 'md'
        ? 'pr-12'
        : 'pr-14'
      : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={`
                absolute left-0 top-0 bottom-0
                flex items-center justify-center
                ${size === 'sm' ? 'w-10' : size === 'md' ? 'w-12' : 'w-14'}
                text-gray-400
              `}
            >
              <span className={iconSizeStyles[size]}>{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`
              ${baseInputStyles}
              ${sizeStyles[size]}
              ${stateStyles[state]}
              ${paddingStyles}
              ${rightPaddingStyles}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            {...props}
          />

          {rightIcon && (
            <div
              className={`
                absolute right-0 top-0 bottom-0
                flex items-center justify-center
                ${size === 'sm' ? 'w-10' : size === 'md' ? 'w-12' : 'w-14'}
                text-gray-400
              `}
            >
              <span className={iconSizeStyles[size]}>{rightIcon}</span>
            </div>
          )}

          {state === 'error' && !rightIcon && (
            <div
              className={`
                absolute right-0 top-0 bottom-0
                flex items-center justify-center
                ${size === 'sm' ? 'w-10' : size === 'md' ? 'w-12' : 'w-14'}
              `}
            >
              <AlertCircle className={`${iconSizeStyles[size]} text-red-500`} />
            </div>
          )}

          {state === 'success' && !rightIcon && (
            <div
              className={`
                absolute right-0 top-0 bottom-0
                flex items-center justify-center
                ${size === 'sm' ? 'w-10' : size === 'md' ? 'w-12' : 'w-14'}
              `}
            >
              <CheckCircle2 className={`${iconSizeStyles[size]} text-green-500`} />
            </div>
          )}
        </div>

        {(helperText || error || success) && (
          <p
            className={`
              mt-2 text-sm
              ${error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-600'}
            `}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Password Input with visibility toggle
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        }
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

/**
 * Search Input with clear button
 */
interface SearchInputProps extends BaseInputProps {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        type="search"
        value={value}
        leftIcon={<Search />}
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <X className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

/**
 * Textarea Component
 */
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size = 'md',
      fullWidth = true,
      resize = 'vertical',
      className = '',
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const state: InputState = error ? 'error' : success ? 'success' : 'default';

    const stateStyles = {
      default: 'border-gray-200 focus:border-red-500 focus:ring-red-500/20',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500/20',
    };

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const baseStyles = `
      w-full
      bg-white
      border-2
      rounded-lg
      text-gray-900
      placeholder:text-gray-400
      transition-all duration-200
      focus:outline-none focus:ring-4
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          className={`
            ${baseStyles}
            ${sizeStyles[size]}
            ${stateStyles[state]}
            ${resizeStyles[resize]}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />

        {(helperText || error || success) && (
          <p
            className={`
              mt-2 text-sm
              ${error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-600'}
            `}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
