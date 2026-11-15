import clsx from 'clsx';

export default function Skeleton({ className, ...props }) {
  return (
    <div className={clsx('animate-pulse bg-gray-200', className)} {...props} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="aspect-[3/4] w-full mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}
