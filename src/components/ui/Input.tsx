import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            suppressHydrationWarning
            className={`
              w-full px-3 py-2.5 border rounded-xl shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-[11px] font-bold text-red-500 uppercase tracking-tight">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-[11px] font-medium text-gray-400 italic">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
