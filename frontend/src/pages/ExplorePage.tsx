import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { products } from '@/services/api';
import ProductCard from '@/components/ui/ProductCard';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductFilters } from '@/types';

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
  min-height: calc(100vh - 4rem);
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
`;

const MainLayout = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.xl};
  margin: 0 auto;
  padding: 2rem 1rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    gap: 3rem;
  }
`;

const Sidebar = styled.aside`
  display: none;
  width: 250px;
  flex-shrink: 0;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
`;

const ContentArea = styled.main`
  flex: 1;
  min-width: 0;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3.5rem;
  font-size: 1.125rem;
  font-family: inherit;
  font-weight: 700;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  transition: all 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
    text-transform: uppercase;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.foreground};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.muted};
`;

const CategoryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const CategoryTab = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  font-family: inherit;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ $active, theme }) => ($active ? theme.colors.foreground : theme.colors.background)};
  color: ${({ $active, theme }) => ($active ? theme.colors.background : theme.colors.foreground)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const FilterSectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.foreground};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 0.5rem;
`;

const FilterGroup = styled.div`
  margin-bottom: 2rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 0.5rem;
`;

const FlexRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const BaseInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-family: inherit;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.foreground};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  margin-bottom: 0.5rem;

  input[type="checkbox"], input[type="radio"] {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-radius: 0;
    cursor: pointer;
    position: relative;

    &:checked {
      background-color: ${({ theme }) => theme.colors.foreground};
      border-color: ${({ theme }) => theme.colors.foreground};
    }
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  font-family: inherit;
  font-weight: 600;
  text-transform: uppercase;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.foreground};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

// --- ICONS ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- DATA ---
const CATEGORIES = ['All', 'Clothes', 'Phones', 'Electronics', 'Furniture', 'Books', 'Accessories', 'Collectibles'] as const;
const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] as const;
const CONDITION_LABELS: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };
const LISTING_TYPES = [{ value: '', label: 'All' }, { value: 'FIXED_PRICE', label: 'Fixed Price' }, { value: 'AUCTION', label: 'Auction' }, { value: 'BEST_OFFER', label: 'Best Offer' }] as const;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest', sort: 'createdAt', order: 'desc' },
  { value: 'price_asc', label: 'Price Low-High', sort: 'price', order: 'asc' },
  { value: 'price_desc', label: 'Price High-Low', sort: 'price', order: 'desc' },
  { value: 'most_viewed', label: 'Most Viewed', sort: 'viewCount', order: 'desc' },
] as const;
const LIMIT = 12;

function buildFilters(searchParams: URLSearchParams, limit: number): ProductFilters {
  const filters: ProductFilters = { limit };
  const search = searchParams.get('search'); if (search) filters.search = search;
  const category = searchParams.get('category'); if (category) filters.category = category;
  const minPrice = searchParams.get('minPrice'); if (minPrice) filters.minPrice = Number(minPrice);
  const maxPrice = searchParams.get('maxPrice'); if (maxPrice) filters.maxPrice = Number(maxPrice);
  const condition = searchParams.get('condition'); if (condition) filters.condition = condition;
  const listingType = searchParams.get('listingType'); if (listingType) filters.listingType = listingType;
  const location = searchParams.get('location'); if (location) filters.location = location;
  const radius = searchParams.get('radius'); if (radius) filters.radius = Number(radius);
  const tags = searchParams.get('tags'); if (tags) filters.tags = tags;
  const sort = searchParams.get('sort'); if (sort) filters.sort = sort;
  const order = searchParams.get('order'); if (order) filters.order = order;
  return filters;
}

function getSortValue(searchParams: URLSearchParams): string {
  const sort = searchParams.get('sort');
  const order = searchParams.get('order');
  if (sort === 'createdAt' && order === 'desc') return 'newest';
  if (sort === 'price' && order === 'asc') return 'price_asc';
  if (sort === 'price' && order === 'desc') return 'price_desc';
  if (sort === 'viewCount' && order === 'desc') return 'most_viewed';
  return 'newest';
}

function ProductGridSkeleton() {
  return (
    <Grid>
      {Array.from({ length: LIMIT }).map((_, i) => (
        <div key={i} style={{ border: '2px solid var(--border)', padding: '1rem' }}>
          <Skeleton variant="rectangular" height={200} style={{ marginBottom: '1rem' }} />
          <Skeleton width="80%" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="40%" />
        </div>
      ))}
    </Grid>
  );
}

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [minPriceInput, setMinPriceInput] = useState(() => searchParams.get('minPrice') || '');
  const [maxPriceInput, setMaxPriceInput] = useState(() => searchParams.get('maxPrice') || '');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (debouncedSearch === currentSearch) return;

    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, searchParams, setSearchParams]);

  const filterKey = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    params.sort();
    return params.toString();
  }, [searchParams]);

  const filters = useMemo(() => buildFilters(searchParams, LIMIT), [searchParams]);

  const {
    data, isLoading, isError, error, isFetchingNextPage, hasNextPage, fetchNextPage, refetch,
  } = useInfiniteQuery({
    queryKey: ['products', filterKey],
    queryFn: ({ pageParam = 1 }) => products.getProducts({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allProducts = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const updateMultipleParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value); else next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
  }, [setSearchParams]);

  const applyFilters = useCallback(() => {
    updateMultipleParams({ minPrice: minPriceInput || null, maxPrice: maxPriceInput || null });
  }, [minPriceInput, maxPriceInput, updateMultipleParams]);

  const selectedConditions = useMemo(() => {
    const c = searchParams.get('condition');
    return new Set(c ? c.split(',') : []);
  }, [searchParams]);

  const toggleCondition = useCallback((condition: string) => {
    const next = new Set(selectedConditions);
    if (next.has(condition)) next.delete(condition); else next.add(condition);
    updateParam('condition', next.size > 0 ? Array.from(next).join(',') : null);
  }, [selectedConditions, updateParam]);

  const activeCategory = searchParams.get('category') || 'All';

  const selectCategory = useCallback((cat: string) => {
    updateParam('category', cat === 'All' ? null : cat);
  }, [updateParam]);

  const activeListingType = searchParams.get('listingType') || '';

  const selectListingType = useCallback((lt: string) => {
    updateParam('listingType', lt || null);
  }, [updateParam]);

  const currentSort = getSortValue(searchParams);

  const handleSortChange = useCallback((value: string) => {
    const option = SORT_OPTIONS.find(o => o.value === value);
    if (option) updateMultipleParams({ sort: option.sort, order: option.order });
  }, [updateMultipleParams]);

  const locationValue = searchParams.get('location') || '';
  const radiusValue = searchParams.get('radius') || '';
  const tagsValue = searchParams.get('tags') || '';

  const renderFilters = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <FilterSectionTitle style={{ marginBottom: 0, borderBottom: 'none' }}>Filters</FilterSectionTitle>
        <button onClick={clearAllFilters} style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
      </div>

      <FilterGroup>
        <Label>Price Range</Label>
        <FlexRow>
          <BaseInput type="number" placeholder="Min" value={minPriceInput} onChange={e => setMinPriceInput(e.target.value)} />
          <span style={{ color: 'var(--muted)' }}>—</span>
          <BaseInput type="number" placeholder="Max" value={maxPriceInput} onChange={e => setMaxPriceInput(e.target.value)} />
        </FlexRow>
      </FilterGroup>

      <FilterGroup>
        <Label>Condition</Label>
        {CONDITIONS.map(cond => (
          <CheckboxLabel key={cond}>
            <input type="checkbox" checked={selectedConditions.has(cond)} onChange={() => toggleCondition(cond)} />
            {CONDITION_LABELS[cond]}
          </CheckboxLabel>
        ))}
      </FilterGroup>

      <FilterGroup>
        <Label>Listing Type</Label>
        {LISTING_TYPES.map(lt => (
          <CheckboxLabel key={lt.value || 'all'}>
            <input type="radio" name="listingType" checked={activeListingType === lt.value} onChange={() => selectListingType(lt.value)} />
            {lt.label}
          </CheckboxLabel>
        ))}
      </FilterGroup>

      <FilterGroup>
        <Label>Location</Label>
        <BaseInput type="text" placeholder="City or ZIP" value={locationValue} onChange={e => updateParam('location', e.target.value || null)} />
      </FilterGroup>

      {locationValue && (
        <FilterGroup>
          <Label>Distance: {radiusValue || '10'} km</Label>
          <input type="range" min="1" max="500" value={radiusValue || '10'} onChange={e => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: 'var(--foreground)' }} />
        </FilterGroup>
      )}

      <FilterGroup>
        <Label>Tags</Label>
        <BaseInput type="text" placeholder="Comma-separated" value={tagsValue} onChange={e => updateParam('tags', e.target.value || null)} />
      </FilterGroup>

      <FilterGroup>
        <Label>Sort By</Label>
        <StyledSelect value={currentSort} onChange={e => handleSortChange(e.target.value)}>
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </StyledSelect>
      </FilterGroup>

      <Button variant="primary" fullWidth onClick={applyFilters}>Apply Filters</Button>
    </>
  );

  return (
    <PageContainer>
      <MainLayout>
        {/* DESKTOP SIDEBAR */}
        <Sidebar>
          <div style={{ position: 'sticky', top: '6rem' }}>
            {renderFilters()}
          </div>
        </Sidebar>

        {/* MAIN CONTENT */}
        <ContentArea>
          <SearchContainer>
            <SearchIconWrapper><SearchIcon /></SearchIconWrapper>
            <SearchInput
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
            />
          </SearchContainer>

          <CategoryTabs>
            {CATEGORIES.map(cat => (
              <CategoryTab key={cat} $active={activeCategory === cat} onClick={() => selectCategory(cat)}>
                {cat}
              </CategoryTab>
            ))}
          </CategoryTabs>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <Button variant="outline" onClick={() => setMobileFilterOpen(true)} className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FilterIcon /> Filters
            </Button>
          </div>

          {isLoading && <ProductGridSkeleton />}

          {isError && (
            <EmptyState
              title="Something went wrong"
              description={error instanceof Error ? error.message : 'Failed to load products'}
              action={{ label: 'Try Again', onClick: () => refetch() }}
            />
          )}

          {!isLoading && !isError && allProducts.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms."
              action={{ label: 'Clear Filters', onClick: clearAllFilters }}
            />
          )}

          {!isLoading && !isError && allProducts.length > 0 && (
            <>
              <Grid>
                {allProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </Grid>

              {hasNextPage && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                  <Button variant="outline" size="lg" isLoading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </ContentArea>
      </MainLayout>

      {/* MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileFilterOpen(false)} />
            <motion.div
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '85vw', maxWidth: '320px', backgroundColor: 'var(--background)', overflowY: 'auto', borderRight: '2px solid var(--border)', padding: '1.5rem' }}
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween' }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={() => setMobileFilterOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
                  <CloseIcon />
                </button>
              </div>
              {renderFilters()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
