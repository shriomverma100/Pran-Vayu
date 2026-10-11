import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '../icons'
import { pressable, SPRING_SNAPPY } from './motion'

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

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  children?: ReactNode
}

/** Brutalist button: lifts on hover, sinks into its shadow on press. */
export function Button({ variant = 'paper', size = 'md', icon, iconRight, children, className = '', disabled, ...rest }: ButtonProps) {
  const shadow = size === 'sm' ? 3 : 4
  const p = pressable(shadow)
  const ghost = variant === 'ghost'
  return (
    <motion.button
      type="button"
      initial="rest"
      animate="rest"
      whileHover={disabled ? undefined : 'hover'}
      whileTap={disabled ? undefined : 'press'}
      variants={ghost ? undefined : p}
      transition={SPRING_SNAPPY}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center font-semibold select-none whitespace-nowrap',
        ghost ? 'border-2 border-transparent hover:border-ink' : 'border-2 border-ink',
        VARIANT[variant],
        SIZE[size],
        disabled ? 'opacity-45 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 20 : 18} />}
    </motion.button>
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
}: Omit<HTMLMotionProps<'a'>, 'children'> & { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName; children?: ReactNode }) {
  const p = pressable(size === 'sm' ? 3 : 4)
  return (
    <motion.a
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="press"
      variants={variant === 'ghost' ? undefined : p}
      transition={SPRING_SNAPPY}
      className={[
        'inline-flex items-center justify-center font-semibold select-none whitespace-nowrap border-2 border-ink no-underline',
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </motion.a>
  )
}

/** Small square icon button with the same press physics. */
export function IconButton({ icon, label, size = 40, className = '', ...rest }: Omit<HTMLMotionProps<'button'>, 'children'> & { icon: IconName; label: string; size?: number }) {
  const p = pressable(3)
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="press"
      variants={p}
      transition={SPRING_SNAPPY}
      style={{ width: size, height: size }}
      className={`inline-grid place-items-center border-2 border-ink bg-white text-ink ${className}`}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </motion.button>
  )
}
