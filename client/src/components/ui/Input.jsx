import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(function Input({
  label,
  error,
  id,
  className = '',
  required = false,
  hint,
  type = 'text',
  ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={clsx(
          'w-full border px-3 py-2.5 text-sm bg-white focus:outline-none transition-colors duration-200',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-gray-200 focus:border-black',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export default Input
