import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from '../icons'

// Buttons press with pure CSS transforms (.press in index.css): the response
// lands on the next frame, with no JavaScript in the click path.

type Variant = 'primary' | 'ink' | 'paper' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-orange text-ink',
  ink: 'bg-ink text-white',
  paper: 'bg-white text-ink',
  ghost: 'bg-transparent text-ink',
}
const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-[0.95rem] gap-2',
  lg: 'h-13 px-6 text-base gap-2.5',
}

const classes = (variant: Variant, size: Size, extra = '') =>
  [
    'inline-flex items-center justify-center font-semibold select-none whitespace-nowrap no-underline',
    variant === 'ghost' ? 'border-2 border-transparent hover:border-ink transition-colors duration-100' : `border-2 border-ink ${size === 'sm' ? 'press-sm' : 'press'}`,
    VARIANT[variant],
    SIZE[size],
    extra,
  ].join(' ')

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  children?: ReactNode
}

export function Button({ variant = 'paper', size = 'md', icon, iconRight, children, className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button type="button" disabled={disabled} className={classes(variant, size, `${disabled ? 'opacity-45 cursor-not-allowed pointer-events-none' : ''} ${className}`)} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 20 : 18} />}
    </button>
  )
}

/** Same press feel for links (Verify, downloads). */
export function LinkButton({
  variant = 'paper',
  size = 'md',
  icon,
  iconRight,
  children,
  className = '',
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName; children?: ReactNode }) {
  return (
    <a className={classes(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </a>
  )
}

/** Small square icon button with the same press feel. */
export function IconButton({ icon, label, size = 40, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; size?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`press-sm inline-grid shrink-0 place-items-center border-2 border-ink bg-white text-ink ${className}`}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </button>
  )
}
