import { InputHTMLAttributes, forwardRef } from 'react';
import { theme } from '../../config/theme';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
    const baseStyles = 'px-3 py-2 rounded-md border focus:outline-none focus:ring-2 transition-shadow duration-200';
    const widthStyles = fullWidth ? 'w-full' : '';
    const errorStyles = error
      ? `border-red-500 focus:ring-red-200`
      : `border-gray-300 focus:ring-[${theme.colors.primary.main}]/20 focus:border-[${theme.colors.primary.main}]`;

    return (
      <div className={`${widthStyles} ${className}`}>
        {label && (
          <label className={`block mb-1 text-sm font-medium text-[${theme.colors.primary.text}]`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${widthStyles}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
); 