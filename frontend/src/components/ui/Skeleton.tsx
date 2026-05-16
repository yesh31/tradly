import styled, { keyframes } from 'styled-components';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
`;

const StyledSkeletonItem = styled.div<{ $variant: SkeletonVariant; $width: string | number; $height: string | number }>`
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  
  border-radius: ${({ $variant }) => {
    if ($variant === 'circular') return '50%';
    if ($variant === 'rectangular') return '0'; // Brutalist rectangular
    return '0'; // Brutalist text
  }};

  width: ${({ $width }) => (typeof $width === 'number' ? `${$width}px` : $width)};
  height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height)};
`;

const SkeletonContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const Skeleton = ({ variant = 'text', width, height, count = 1, className, style }: SkeletonProps) => {
  const items = Array.from({ length: count });

  return (
    <SkeletonContainer className={className} style={style}>
      {items.map((_, i) => (
        <StyledSkeletonItem
          key={i}
          $variant={variant}
          $width={width ?? (variant === 'circular' ? (height ?? 40) : '100%')}
          $height={height ?? (variant === 'text' ? 16 : 40)}
        />
      ))}
    </SkeletonContainer>
  );
};

export default Skeleton;
