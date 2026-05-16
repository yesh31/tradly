import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Button, Input } from '@/components/ui';
import { auth } from '@/services/api';

const PageContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 4rem);
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 1rem;
`;

const FormCard = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 2.5rem 2rem;
  box-shadow: 8px 8px 0px ${({ theme }) => theme.colors.border};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.05em;
  text-align: center;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.foreground};
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 2rem;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.muted};

  a {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.foreground};
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
  }
`;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'At least 8 characters required';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await auth.resetPassword(token, password);
      if (res.data !== undefined || !res.error) {
        toast.success('Password reset successfully!');
        navigate('/login', { replace: true });
      } else {
        toast.error(res.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <PageContainer>
        <FormCard {...fadeIn} style={{ textAlign: 'center' }}>
          <Title>Tradly</Title>
          <p style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Invalid or missing reset token.
          </p>
          <FooterText>
            <Link to="/forgot-password">Request a new reset link</Link>
          </FooterText>
        </FormCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FormCard {...fadeIn}>
        <Title>Tradly</Title>
        <Subtitle>Enter your new password</Subtitle>

        <Form onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Reset Password
          </Button>
        </Form>

        <FooterText>
          Remember your password? <Link to="/login">Sign in</Link>
        </FooterText>
      </FormCard>
    </PageContainer>
  );
}
