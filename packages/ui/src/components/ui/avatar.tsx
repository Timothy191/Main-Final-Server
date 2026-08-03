import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  const showImage = src && !imageError

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border border-white/20 bg-slate-100 text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-800 dark:text-slate-200',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold uppercase tracking-wider">
          {(fallback || alt.slice(0, 2)).toUpperCase()}
        </div>
      )}
    </div>
  )
}
