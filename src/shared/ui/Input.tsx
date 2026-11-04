import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  disabled,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : generatedId);
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--alsm-text)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--alsm-text-muted)]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={twMerge(
            clsx(
              'w-full h-11 bg-[var(--alsm-surface)] border text-[var(--alsm-text)] rounded-lg px-3.5 text-sm transition-all placeholder:text-[var(--alsm-text-muted)] shadow-xs font-normal',
              'hover:border-[var(--alsm-text-muted)]',
              'focus:outline-none focus:border-[var(--alsm-primary)] focus:ring-[3px] focus:ring-[var(--alsm-focus-ring)]',
              'disabled:bg-[var(--alsm-bg)] disabled:text-[var(--alsm-text-muted)] disabled:border-[var(--alsm-border)] disabled:cursor-not-allowed',
              icon && 'pl-10',
              error
                ? 'border-[var(--alsm-danger)] hover:border-[var(--alsm-danger)] focus:border-[var(--alsm-danger)] focus:ring-[var(--alsm-focus-ring)]'
                : 'border-[var(--alsm-input-border)]',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--alsm-danger)] font-medium mt-1">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-[var(--alsm-text-muted)] mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const PasswordInput: React.FC<InputProps> = (props) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className={`absolute right-2.5 ${
          props.label ? 'top-[30px]' : 'top-1/2 -translate-y-1/2'
        } p-1 text-[var(--alsm-text-muted)] hover:text-[var(--alsm-text)] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alsm-primary)] cursor-pointer transition-colors`}
      >
        {show ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default Input;
