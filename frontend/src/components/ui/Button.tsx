import { forwardRef, type ReactNode, type MouseEventHandler } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const variantStyles = {
  primary: css`
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.background};
    border: 2px solid ${({ theme }) => theme.colors.primary};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.foreground};
    &:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px ${({ theme }) => theme.colors.foreground};
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px ${({ theme }) => theme.colors.foreground};
    }
  `,
  outline: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.foreground};
    border: 2px solid ${({ theme }) => theme.colors.foreground};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.muted};
    &:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px ${({ theme }) => theme.colors.muted};
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px ${({ theme }) => theme.colors.muted};
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.foreground};
    border: 2px solid transparent;
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.secondary};
    }
  `,
  danger: css`
    background-color: ${({ theme }) => theme.colors.error};
    color: #fff;
    border: 2px solid ${({ theme }) => theme.colors.error};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.foreground};
    &:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px ${({ theme }) => theme.colors.foreground};
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px ${({ theme }) => theme.colors.foreground};
    }
  `,
};

const sizeStyles = {
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  `,
  lg: css`
    padding: 1rem 2rem;
    font-size: 1.125rem;
  `,
};

const StyledButton = styled(motion.button)<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: inherit;
  transition: all 0.2s ease;
  cursor: pointer;
  
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none !important;
    transform: none !important;
  }
`;

const Spinner = styled.svg`
  animation: spin 1s linear infinite;
  height: 1rem;
  width: 1rem;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, fullWidth = false, disabled, children, className, type = 'button', onClick }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        disabled={isDisabled}
        type={type}
        onClick={onClick}
        className={className}
      >
        {isLoading && (
          <Spinner viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
          </Spinner>
        )}
        {children}
      </StyledButton>
    );
  },
);

Button.displayName = 'Button';

export default Button;
