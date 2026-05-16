import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const SuccessIcon = styled.div`
  margin: 0 auto 1rem auto;
  display: flex;
  height: 4rem;
  width: 4rem;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.foreground};
  color: ${({ theme }) => theme.colors.background};
`;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await auth.forgotPassword(email.trim());
      if (res.data !== undefined || !res.error) {
        setSent(true);
        toast.success('Reset link sent!');
      } else {
        toast.error(res.error || 'Failed to send reset link');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <FormCard {...fadeIn}>
        <Title>Tradly</Title>
        <Subtitle>Reset your password</Subtitle>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <SuccessIcon>
              <svg style={{ height: '2rem', width: '2rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </SuccessIcon>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check your email</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              We've sent a password reset link to <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{email}</span>.
            </p>
            <FooterText>
              <Link to="/login">Back to login</Link>
            </FooterText>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '-0.5rem' }}>
              Enter the email address associated with your account and we'll send you a reset link.
            </p>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Send Reset Link
            </Button>
          </Form>
        )}

        {!sent && (
          <FooterText>
            Remember your password? <Link to="/login">Sign in</Link>
          </FooterText>
        )}
      </FormCard>
    </PageContainer>
  );
}
