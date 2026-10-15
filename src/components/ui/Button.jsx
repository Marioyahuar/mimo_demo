import Link from 'next/link';
import Icon from './Icon.jsx';

const VARIANTS = {
  primary:
    'bg-primary-container text-on-primary shadow-[0_8px_24px_-2px_rgba(232,146,124,0.38)] hover:-translate-y-0.5 hover:bg-primary',
  soft:
    'bg-surface-container-low hover:bg-surface-container text-on-surface shadow-sm hover:-translate-y-0.5',
  light:
    'bg-surface-container-lowest text-primary shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:bg-surface font-bold',
};

/**
 * Pill-shaped call to action. Renders as a link when `href` is set,
 * otherwise as a real `<button>` (used by the booking wizard).
 */
export default function Button({
  href,
  children,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  iconSize = 20,
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) {
  const classes = `inline-flex items-center justify-center gap-space-xs rounded-full px-space-xl py-space-sm font-label-lg text-label-lg transition-all duration-200 ${
    VARIANTS[variant]
  } ${fullWidth ? 'w-full' : ''} ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`;

  const inner = (
    <>
      {icon && iconPosition === 'left' && <Icon name={icon} size={iconSize} />}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <Icon name={icon} size={iconSize} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {inner}
    </button>
  );
}
