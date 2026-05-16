import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import styled from 'styled-components';

interface SharedProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
  className?: string;
}

type InputProps = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    textarea?: false;
    rows?: never;
  };

type TextareaProps = SharedProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
    textarea: true;
    rows?: number;
  };

type Props = InputProps | TextareaProps;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.foreground};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{ $hasIcon: boolean }>`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 0.75rem 1rem;
  padding-left: ${({ $hasIcon }) => ($hasIcon ? '2.5rem' : '1rem')};
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.foreground};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const StyledTextarea = styled.textarea<{ $hasIcon: boolean }>`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 0.75rem 1rem;
  padding-left: ${({ $hasIcon }) => ($hasIcon ? '2.5rem' : '1rem')};
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.foreground};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const IconWrapper = styled.span`
  position: absolute;
  left: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.error};
`;

const Input = (props: Props) => {
  const { label, error, icon, className, textarea, ...rest } = props as SharedProps & Record<string, unknown>;

  const inputElement = textarea ? (
    <StyledTextarea
      $hasIcon={!!icon}
      rows={(props as TextareaProps).rows ?? 3}
      className={className}
      {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
    />
  ) : (
    <StyledInput
      $hasIcon={!!icon}
      className={className}
      {...(rest as InputHTMLAttributes<HTMLInputElement>)}
    />
  );

  return (
    <InputContainer>
      {label && <Label>{label}</Label>}
      <InputWrapper>
        {icon && <IconWrapper>{icon}</IconWrapper>}
        {inputElement}
      </InputWrapper>
      {error && <ErrorText>{error}</ErrorText>}
    </InputContainer>
  );
};

export default Input;
