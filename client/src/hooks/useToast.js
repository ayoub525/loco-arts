import toast from 'react-hot-toast'

const baseStyle = {
  background: '#000',
  color: '#fff',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  borderRadius: '0',
  padding: '12px 16px',
}

export function useToast() {
  const success = (message) => toast.success(message, {
    style: baseStyle,
    iconTheme: { primary: '#fff', secondary: '#000' },
  })

  const error = (message) => toast.error(message, {
    style: { ...baseStyle, background: '#1a1a1a' },
    iconTheme: { primary: '#fff', secondary: '#1a1a1a' },
  })

  const info = (message) => toast(message, {
    style: baseStyle,
    icon: 'ℹ️',
  })

  const loading = (message) => toast.loading(message, {
    style: baseStyle,
  })

  const dismiss = (id) => toast.dismiss(id)

  const promise = (promiseFn, messages) => toast.promise(promiseFn, messages, {
    style: baseStyle,
  })

  return { success, error, info, loading, dismiss, promise }
}
