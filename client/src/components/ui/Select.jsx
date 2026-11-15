import { forwardRef } from 'react'
import clsx from 'clsx'

const Select = forwardRef(function Select({
  label,
  error,
  id,
  className = '',
  required = false,
  children,
  placeholder,
  ...props
}, ref) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full border px-3 py-2.5 text-sm bg-white focus:outline-none transition-colors duration-200 appearance-none pr-10',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-200 focus:border-black',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export default Select
