import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineUsers, HiOutlineTag, HiOutlineFlag, HiOutlineChartBar,
  HiOutlineSearch, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineTrash,
  HiOutlineShieldCheck, HiOutlineExclamationCircle, HiOutlineTrendingUp,
  HiOutlineCurrencyDollar, HiOutlineUserGroup, HiOutlineStar,
} from 'react-icons/hi';
import { Button, Input, Skeleton, Badge, EmptyState } from '@/components/ui';
import { admin } from '@/services/api';
import type { User, Product, Report, PaginatedResponse } from '@/types';

type TabKey = 'users' | 'products' | 'reports' | 'analytics';

interface AdminAnalytics {
  totalUsers: number;
  activeProducts: number;
  productsSold30d: number;
  totalBids: number;
  pendingReports: number;
  totalReports: number;
  conversionRate: number;
  userGrowth: number;
  revenue30d: number;
  avgListingPrice: number;
  totalAdmins: number;
  totalModerators: number;
}

interface AdminProduct extends Product {
  user: User;
}

interface AdminReport extends Report {
  reporter: User;
  reported: User;
  product?: Product;
}

const tabs: { key: TabKey; label: string; icon: typeof HiOutlineUsers }[] = [
  { key: 'users', label: 'Users', icon: HiOutlineUsers },
  { key: 'products', label: 'Products', icon: HiOutlineTag },
  { key: 'reports', label: 'Reports', icon: HiOutlineFlag },
  { key: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
];

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  SOLD: 'info',
  DELETED: 'error',
  PENDING: 'warning',
  REVIEWED: 'info',
  RESOLVED: 'success',
  DISMISSED: 'default',
  VERIFIED: 'success',
  BANNED: 'error',
};

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0 0 0.5rem;
`;

const PageSubtitle = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
`;

const StyledStatCard = styled(motion.div)`
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  padding: 1.25rem;
  transition: all 0.2s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const StatIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
`;

const StatValueText = styled.p`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const StatLabelText = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  margin: 0.25rem 0 0;
`;

const TabsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.foreground : theme.colors.muted)};
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const TabIndicator = styled(motion.div)`
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.foreground};
`;

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
  }
`;

const SearchWrapper = styled.div`
  flex: 1;
`;

const StyledSelect = styled.select`
  padding: 0.75rem 1rem;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.foreground};
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const Th = styled.th`
  padding: 1rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.secondary};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const ActionSelect = styled.select`
  padding: 0.25rem 0.5rem;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  cursor: pointer;
  margin-right: 0.5rem;
`;

const IconButton = styled.button`
  padding: 0.25rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 2rem;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  border: 2px solid ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.border)};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.background)};
  color: ${({ theme, $active }) => ($active ? theme.colors.background : theme.colors.foreground)};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.foreground};
    color: ${({ theme }) => theme.colors.background};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// --- COMPONENTS ---

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string | number; trend?: string }) {
  return (
    <StyledStatCard>
      <StatIconWrapper>
        {icon}
        {trend && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>{trend}</span>}
      </StatIconWrapper>
      <StatValueText>{value}</StatValueText>
      <StatLabelText>{label}</StatLabelText>
    </StyledStatCard>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <PaginationContainer>
      <PageButton onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <HiOutlineChevronLeft size={16} />
      </PageButton>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 3, totalPages - 6));
          const p = start + i;
          if (p > totalPages) return null;
          return (
            <PageButton key={p} $active={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageButton>
          );
        })}
      </div>
      <PageButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <HiOutlineChevronRight size={16} />
      </PageButton>
    </PaginationContainer>
  );
}

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem' }}>
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} variant="rectangular" height={40} style={{ flex: 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => admin.getUsers({ page, limit: 15, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => admin.banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User banned');
    },
    onError: () => toast.error('Failed to ban user'),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => admin.unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User unbanned');
    },
    onError: () => toast.error('Failed to unban user'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' | 'MODERATOR' }) => admin.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const handleBan = (user: User) => {
    if (user.isBanned) {
      unbanMutation.mutate(user.id);
    } else {
      const reason = prompt('Enter ban reason:');
      if (reason) banMutation.mutate({ id: user.id, reason });
    }
  };

  const users = (data as PaginatedResponse<User> | undefined)?.data ?? [];

  if (isError) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>Failed to load users.</div>;

  return (
    <motion.div {...fadeSlide}>
      <Toolbar>
        <SearchWrapper>
          <Input placeholder="Search users by name, email, or username..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} icon={<HiOutlineSearch size={16} />} />
        </SearchWrapper>
      </Toolbar>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : users.length === 0 ? (
        <EmptyState icon={<HiOutlineUsers size={40} />} title="No users found" description={search ? 'Try a different search term.' : 'No users registered yet.'} />
      ) : (
        <>
          <TableContainer>
            <StyledTable>
              <thead>
                <tr>
                  <Th>Avatar</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th>Trust Score</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: User) => (
                  <Tr key={user.id}>
                    <Td>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '1px solid var(--border)', overflow: 'hidden', backgroundColor: 'var(--secondary)' }}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '0.75rem', fontWeight: 800 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td style={{ fontWeight: 800 }}>{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>@{user.username}</Td>
                    <Td>
                      <ActionSelect value={user.role} onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value as 'USER' | 'ADMIN' | 'MODERATOR' })}>
                        <option value="USER">User</option>
                        <option value="MODERATOR">Mod</option>
                        <option value="ADMIN">Admin</option>
                      </ActionSelect>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '3rem', height: '0.25rem', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)' }}>
                          <div style={{ height: '100%', backgroundColor: 'var(--foreground)', width: `${Math.min(user.trustScore, 100)}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{user.trustScore}</span>
                      </div>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Badge variant={user.isVerified ? 'success' : 'default'} size="sm">{user.isVerified ? 'Verified' : 'Unverified'}</Badge>
                        {user.isBanned && <Badge variant="error" size="sm">Banned</Badge>}
                      </div>
                    </Td>
                    <Td style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{format(new Date(user.createdAt), 'MMM d, yyyy')}</Td>
                    <Td>
                      <Button variant={user.isBanned ? 'outline' : 'danger'} size="sm" onClick={() => handleBan(user)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </StyledTable>
          </TableContainer>
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </motion.div>
  );
}

function ProductsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'products', page, search, statusFilter],
    queryFn: () => admin.getAdminProducts({ page, limit: 15, search: search || undefined, status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => admin.updateProductStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => admin.deleteProductAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const products = (data as PaginatedResponse<AdminProduct> | undefined)?.data ?? [];

  if (isError) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>Failed to load products.</div>;

  return (
    <motion.div {...fadeSlide}>
      <Toolbar>
        <SearchWrapper>
          <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} icon={<HiOutlineSearch size={16} />} />
        </SearchWrapper>
        <StyledSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="SOLD">Sold</option>
          <option value="DELETED">Deleted</option>
        </StyledSelect>
      </Toolbar>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : products.length === 0 ? (
        <EmptyState icon={<HiOutlineTag size={40} />} title="No products found" description={search || statusFilter ? 'Try different filters.' : 'No products listed yet.'} />
      ) : (
        <>
          <TableContainer>
            <StyledTable>
              <thead>
                <tr>
                  <Th>Image</Th>
                  <Th>Title</Th>
                  <Th>Seller</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th>Category</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: AdminProduct) => (
                  <Tr key={product.id}>
                    <Td>
                      <div style={{ width: '2.5rem', height: '2.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                        {product.images?.[0] ? (
                          <img src={product.images[0].thumbnail ?? product.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '0.65rem' }}>IMG</div>
                        )}
                      </div>
                    </Td>
                    <Td style={{ fontWeight: 800 }}>{product.title}</Td>
                    <Td>{product.user?.name ?? 'Unknown'}</Td>
                    <Td style={{ fontWeight: 800 }}>{product.price ? `$${product.price.toFixed(2)}` : product.startingBid ? `From $${product.startingBid.toFixed(2)}` : '-'}</Td>
                    <Td>
                      <Badge variant={statusColors[product.status] ?? 'default'} size="sm">{product.status}</Badge>
                    </Td>
                    <Td style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{product.category}</Td>
                    <Td style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{format(new Date(product.createdAt), 'MMM d, yyyy')}</Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ActionSelect value={product.status} onChange={(e) => statusMutation.mutate({ id: product.id, status: e.target.value })}>
                          <option value="ACTIVE">Active</option>
                          <option value="PAUSED">Paused</option>
                          <option value="SOLD">Sold</option>
                        </ActionSelect>
                        <IconButton onClick={() => handleDelete(product.id, product.title)}>
                          <HiOutlineTrash size={16} />
                        </IconButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </StyledTable>
          </TableContainer>
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </motion.div>
  );
}

function ReportsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reports', page, statusFilter],
    queryFn: () => admin.getReports({ page, limit: 15, status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const handleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => admin.handleReport(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success('Report updated');
    },
    onError: () => toast.error('Failed to update report'),
  });

  const reports = (data as PaginatedResponse<AdminReport> | undefined)?.data ?? [];

  if (isError) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>Failed to load reports.</div>;

  return (
    <motion.div {...fadeSlide}>
      <Toolbar>
        <StyledSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </StyledSelect>
      </Toolbar>

      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : reports.length === 0 ? (
        <EmptyState icon={<HiOutlineFlag size={40} />} title="No reports found" description={statusFilter ? 'No reports with this status.' : 'All clear — no reports yet.'} />
      ) : (
        <>
          <TableContainer>
            <StyledTable>
              <thead>
                <tr>
                  <Th>Reporter</Th>
                  <Th>Reported User</Th>
                  <Th>Reason</Th>
                  <Th>Product</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: AdminReport) => (
                  <Tr key={report.id}>
                    <Td>{report.reporter?.name ?? 'Unknown'}</Td>
                    <Td>{report.reported?.name ?? 'Unknown'}</Td>
                    <Td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.reason}</Td>
                    <Td>{report.product?.title ?? '-'}</Td>
                    <Td>
                      <Badge variant={statusColors[report.status] ?? 'default'} size="sm">{report.status}</Badge>
                    </Td>
                    <Td style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{format(new Date(report.createdAt), 'MMM d, yyyy')}</Td>
                    <Td>
                      {report.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <Button variant="outline" size="sm" onClick={() => handleMutation.mutate({ id: report.id, status: 'REVIEWED' })} style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}>Review</Button>
                          <Button variant="primary" size="sm" onClick={() => handleMutation.mutate({ id: report.id, status: 'RESOLVED' })} style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}>Resolve</Button>
                          <Button variant="outline" size="sm" onClick={() => handleMutation.mutate({ id: report.id, status: 'DISMISSED' })} style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}>Dismiss</Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>-</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </StyledTable>
          </TableContainer>
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </motion.div>
  );
}

function AnalyticsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => admin.getAnalytics(),
  });

  const analytics = data?.data as AdminAnalytics | undefined;

  if (isError) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>Failed to load analytics.</div>;

  if (isLoading || !analytics) {
    return (
      <StatsGrid>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={110} style={{ border: '2px solid var(--border)' }} />
        ))}
      </StatsGrid>
    );
  }

  const statCards = [
    { icon: <HiOutlineUserGroup size={20} />, label: 'Total Users', value: analytics.totalUsers.toLocaleString() },
    { icon: <HiOutlineTag size={20} />, label: 'Active Products', value: analytics.activeProducts.toLocaleString() },
    { icon: <HiOutlineCurrencyDollar size={20} />, label: 'Products Sold (30d)', value: analytics.productsSold30d.toLocaleString() },
    { icon: <HiOutlineTrendingUp size={20} />, label: 'Total Bids', value: analytics.totalBids.toLocaleString() },
    { icon: <HiOutlineExclamationCircle size={20} />, label: 'Pending Reports', value: analytics.pendingReports.toLocaleString() },
    { icon: <HiOutlineFlag size={20} />, label: 'Total Reports', value: analytics.totalReports.toLocaleString() },
  ];

  const detailCards = [
    { icon: <HiOutlineChartBar size={20} />, label: 'Conversion Rate', value: `${analytics.conversionRate}%` },
    { icon: <HiOutlineTrendingUp size={20} />, label: 'User Growth', value: `${analytics.userGrowth}%` },
    { icon: <HiOutlineCurrencyDollar size={20} />, label: 'Revenue (30d)', value: `$${analytics.revenue30d.toLocaleString()}` },
    { icon: <HiOutlineStar size={20} />, label: 'Avg. Listing Price', value: `$${analytics.avgListingPrice.toFixed(2)}` },
    { icon: <HiOutlineShieldCheck size={20} />, label: 'Admins', value: analytics.totalAdmins.toLocaleString() },
    { icon: <HiOutlineUsers size={20} />, label: 'Moderators', value: analytics.totalModerators.toLocaleString() },
  ];

  return (
    <motion.div {...fadeSlide} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Overview</h3>
        <StatsGrid>
          {statCards.map((card) => <StatCard key={card.label} {...card} />)}
        </StatsGrid>
      </div>
      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Details</h3>
        <StatsGrid>
          {detailCards.map((card) => <StatCard key={card.label} {...card} />)}
        </StatsGrid>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <PageHeader>
          <PageTitle>Admin Dashboard</PageTitle>
          <PageSubtitle>Manage users, products, reports, and view platform analytics.</PageSubtitle>
        </PageHeader>

        <StatsGrid>
          <StatCard icon={<HiOutlineUserGroup size={20} />} label="Total Users" value="-" />
          <StatCard icon={<HiOutlineTag size={20} />} label="Active Products" value="-" />
          <StatCard icon={<HiOutlineCurrencyDollar size={20} />} label="Sold (30d)" value="-" />
          <StatCard icon={<HiOutlineTrendingUp size={20} />} label="Total Bids" value="-" />
          <StatCard icon={<HiOutlineExclamationCircle size={20} />} label="Pending Reports" value="-" />
          <StatCard icon={<HiOutlineFlag size={20} />} label="Total Reports" value="-" />
        </StatsGrid>

        <TabsContainer>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TabButton key={tab.key} onClick={() => setActiveTab(tab.key)} $isActive={isActive}>
                <Icon size={16} />
                {tab.label}
                {isActive && <TabIndicator layoutId="admin-tab-indicator" />}
              </TabButton>
            );
          })}
        </TabsContainer>

        <AnimatePresence mode="wait">
          {activeTab === 'users' && <UsersTab key="users" />}
          {activeTab === 'products' && <ProductsTab key="products" />}
          {activeTab === 'reports' && <ReportsTab key="reports" />}
          {activeTab === 'analytics' && <AnalyticsTab key="analytics" />}
        </AnimatePresence>
      </motion.div>
    </PageContainer>
  );
}
