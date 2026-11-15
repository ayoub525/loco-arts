import clsx from 'clsx';

const statusColors = {
  PENDING: 'bg-orange-100 text-orange-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-200 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-orange-100 text-orange-800',
  danger: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-700',
  new: 'bg-black text-white',
};

export default function Badge({ variant = 'neutral', children, className }) {
  return (
    <span className={clsx('inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide', statusColors[variant] || statusColors.neutral, className)}>
      {children}
    </span>
  );
}
