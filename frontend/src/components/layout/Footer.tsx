import styled from 'styled-components';

const FooterContainer = styled.footer`
  border-top: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  padding: 2rem 1rem;
`;

const Copyright = styled.div`
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export default function Footer() {
  return (
    <FooterContainer>
      <Copyright>
        &copy; {new Date().getFullYear()} Tradly. All rights reserved. Built with precision.
      </Copyright>
    </FooterContainer>
  );
}
