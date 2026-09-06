import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './PixelButton.module.css';

type Variant = 'default' | 'accent';
type Size = 'default' | 'large';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}

export function PixelButton({
  children,
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  ...rest
}: PixelButtonProps) {
  const classes = [
    styles.button,
    variant === 'accent' ? styles.accent : '',
    size === 'large' ? styles.large : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
