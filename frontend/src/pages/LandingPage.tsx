import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { useAuthStore } from '@/store/authStore';
import {
  HiOutlinePhotograph,
  HiOutlineChat,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineCollection,
} from 'react-icons/hi';

// --- STYLED COMPONENTS ---

const PageWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  overflow-x: hidden;
`;

const Section = styled.section<{ $bg?: string; $bordered?: boolean }>`
  padding: 6rem 1rem;
  background-color: ${({ $bg, theme }) => $bg || theme.colors.background};
  border-bottom: ${({ $bordered, theme }) => ($bordered ? `2px solid ${theme.colors.border}` : 'none')};
  position: relative;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 10rem 2rem;
  }
`;

const Container = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.xl};
  margin: 0 auto;
  position: relative;
  z-index: 10;
`;

// Hero
const HeroContent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.06em;
  text-transform: uppercase;
  margin-bottom: 2rem;

  .hollow {
    color: transparent;
    -webkit-text-stroke: 2px ${({ theme }) => theme.colors.foreground};
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 500;
  max-width: 600px;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 3rem;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    width: auto;
    max-width: none;
  }
`;

const PrimaryButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  text-align: center;
  transition: all 0.2s;
  box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.foreground};

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px ${({ theme }) => theme.colors.foreground};
  }
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px ${({ theme }) => theme.colors.foreground};
  }
`;

const OutlineButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid ${({ theme }) => theme.colors.foreground};
  text-align: center;
  transition: all 0.2s;
  box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.muted};

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px ${({ theme }) => theme.colors.muted};
  }
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px ${({ theme }) => theme.colors.muted};
  }
`;

// Marquee
const marqueeAnim = keyframes`
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
`;

const MarqueeContainer = styled.div`
  overflow: hidden;
  white-space: nowrap;
  border-top: 2px solid ${({ theme }) => theme.colors.border};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding: 1rem 0;
  background: ${({ theme }) => theme.colors.secondary};
`;

const MarqueeContent = styled.div`
  display: inline-block;
  animation: ${marqueeAnim} 20s linear infinite;
  font-size: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.foreground};

  span {
    margin: 0 2rem;
    -webkit-text-stroke: 1px ${({ theme }) => theme.colors.foreground};
    color: transparent;
  }
`;

// Section Titles
const SectionTitle = styled.h2`
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.05em;
  margin-bottom: 4rem;
  text-align: left;
`;

// Grid
const Grid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(${({ $cols }) => $cols || 3}, minmax(0, 1fr));
  }
`;

// Feature Card
const FeatureCardWrapper = styled(motion.div)`
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: ${({ theme }) => theme.colors.foreground};
    color: ${({ theme }) => theme.colors.background};
    transform: translateY(-10px);
    box-shadow: 10px 10px 0px ${({ theme }) => theme.colors.border};

    svg {
      color: ${({ theme }) => theme.colors.background};
    }
    p {
      color: ${({ theme }) => theme.colors.background};
    }
  }
`;

const FeatureIcon = styled.div`
  margin-bottom: 1.5rem;
  svg {
    width: 3rem;
    height: 3rem;
    color: ${({ theme }) => theme.colors.foreground};
    transition: color 0.3s ease;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const FeatureDesc = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.5;
  transition: color 0.3s ease;
  flex-grow: 1;
`;

// Category Card
const CategoryCardWrapper = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  transition: all 0.2s ease;
  
  svg {
    width: 3rem;
    height: 3rem;
    transition: transform 0.2s ease;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    border-color: ${({ theme }) => theme.colors.foreground};
    
    svg {
      transform: scale(1.2);
    }
  }
`;

const CategoryName = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// --- DATA ---

const features = [
  { icon: HiOutlinePhotograph, title: 'Post in Seconds', description: 'Snap a photo, set a price, and publish your listing instantly.' },
  { icon: HiOutlineChat, title: 'Real-time Chat', description: 'Connect directly with buyers and sellers through built-in messaging.' },
  { icon: HiOutlineShieldCheck, title: 'Safe & Secure', description: 'Verified users and community-based reputation system.' },
  { icon: HiOutlineLightningBolt, title: 'AI-Powered', description: 'Smart pricing suggestions connect you with the right audience.' },
  { icon: HiOutlineGlobe, title: 'Local Discovery', description: 'Find items near you or browse listings from anywhere.' },
  { icon: HiOutlineSearch, title: 'Smart Search', description: 'Powerful filters help you find exactly what you need.' },
];

const categories = [
  { name: 'Clothes', icon: HiOutlineTag, slug: 'Clothes' },
  { name: 'Phones', icon: HiOutlineDeviceMobile, slug: 'Phones' },
  { name: 'Electronics', icon: HiOutlineDesktopComputer, slug: 'Electronics' },
  { name: 'Furniture', icon: HiOutlineHome, slug: 'Furniture' },
  { name: 'Books', icon: HiOutlineBookOpen, slug: 'Books' },
  { name: 'Other', icon: HiOutlineCollection, slug: 'Other' },
];

// --- ANIMATION HELPER ---

function FadeInView({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

// --- COMPONENT ---

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <PageWrapper>
      {/* HERO SECTION */}
      <Section $bordered>
        <Container>
          <HeroContent>
            <HeroTitle
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              Buy & Sell <br />
              <span className="hollow">Without Limits</span>
            </HeroTitle>
            <HeroSubtitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              A minimal, fast, and direct marketplace for the next generation. No middlemen. Just you and the goods.
            </HeroSubtitle>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <ButtonGroup>
                {isAuthenticated ? (
                  <>
                    <PrimaryButton to="/explore">Explore Now</PrimaryButton>
                    <OutlineButton to="/my-listings">Dashboard</OutlineButton>
                  </>
                ) : (
                  <>
                    <PrimaryButton to="/create">Start Selling</PrimaryButton>
                    <OutlineButton to="/explore">Browse Items</OutlineButton>
                  </>
                )}
              </ButtonGroup>
            </motion.div>
          </HeroContent>
        </Container>
      </Section>

      {/* MARQUEE */}
      <MarqueeContainer>
        <MarqueeContent>
          TRADLY <span>•</span> NO FEES <span>•</span> DIRECT TRADE <span>•</span> TRADLY <span>•</span> NO FEES <span>•</span> DIRECT TRADE <span>•</span> TRADLY <span>•</span> NO FEES <span>•</span> DIRECT TRADE <span>•</span> TRADLY <span>•</span> NO FEES <span>•</span> DIRECT TRADE <span>•</span>
        </MarqueeContent>
      </MarqueeContainer>

      {/* FEATURES SECTION */}
      <Section>
        <Container>
          <FadeInView>
            <SectionTitle>Why Tradly?</SectionTitle>
          </FadeInView>
          <Grid>
            {features.map((feature, i) => (
              <FadeInView key={feature.title} delay={i * 0.1}>
                <FeatureCardWrapper>
                  <FeatureIcon><feature.icon /></FeatureIcon>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDesc>{feature.description}</FeatureDesc>
                </FeatureCardWrapper>
              </FadeInView>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* CATEGORIES SECTION */}
      <Section $bg="var(--secondary)" $bordered>
        <Container>
          <FadeInView>
            <SectionTitle>Explore</SectionTitle>
          </FadeInView>
          <Grid $cols={3}>
            {categories.map((cat, i) => (
              <FadeInView key={cat.name} delay={i * 0.1}>
                <CategoryCardWrapper to={`/explore?category=${cat.slug}`}>
                  <cat.icon />
                  <CategoryName>{cat.name}</CategoryName>
                </CategoryCardWrapper>
              </FadeInView>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* CTA SECTION */}
      <Section>
        <Container style={{ textAlign: 'center' }}>
          <FadeInView>
            <HeroTitle style={{ fontSize: 'clamp(2rem, 8vw, 6rem)', marginBottom: '1rem' }}>
              Ready to <span className="hollow">Start?</span>
            </HeroTitle>
            <HeroSubtitle style={{ margin: '0 auto 3rem auto' }}>
              Join the fastest growing peer-to-peer marketplace today.
            </HeroSubtitle>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <ButtonGroup>
                <PrimaryButton to="/register">Create Account</PrimaryButton>
              </ButtonGroup>
            </div>
          </FadeInView>
        </Container>
      </Section>
    </PageWrapper>
  );
}
