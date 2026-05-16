import type { ReactNode } from 'react';
import styled from 'styled-components';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const StyledBadge = styled.span<{ $variant: BadgeVariant; $size: BadgeSize }>`
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid ${({ theme }) => theme.colors.border};
  
  background-color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'success': return theme.colors.success;
      case 'warning': return '#f59e0b';
      case 'error': return theme.colors.error;
      case 'info': return '#3b82f6';
      default: return theme.colors.secondary;
    }
  }};
  
  color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'success':
      case 'warning':
      case 'error':
      case 'info':
        return '#fff';
      default:
        return theme.colors.foreground;
    }
  }};

  padding: ${({ $size }) => ($size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.75rem')};
  font-size: ${({ $size }) => ($size === 'sm' ? '0.75rem' : '0.875rem')};
`;

const Badge = ({ children, variant = 'default', size = 'sm', className }: BadgeProps) => {
  return (
    <StyledBadge $variant={variant} $size={size} className={className}>
      {children}
    </StyledBadge>
  );
};

export default Badge;
