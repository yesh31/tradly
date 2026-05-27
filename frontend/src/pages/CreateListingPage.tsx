import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import api, { products, ai } from '@/services/api';
import type { ApiResponse, CreateProductInput } from '@/types';
import { Button, Input, Badge } from '@/components/ui';

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
  max-width: 48rem;
  margin: 0 auto;
  padding: 2.5rem 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
  text-transform: uppercase;
  margin-bottom: 2rem;
`;

const StepIndicatorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
`;

const StepCircle = styled.div<{ $active: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  border: 2px solid ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.border)};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.background)};
  color: ${({ theme, $active }) => ($active ? theme.colors.background : theme.colors.muted)};
  transition: all 0.2s;
`;

const StepLabel = styled.span<{ $active: boolean }>`
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.muted)};
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: inline;
  }
`;

const StepLine = styled.div<{ $active: boolean }>`
  width: 2rem;
  height: 2px;
  margin: 0 0.5rem;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.border)};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 4rem;
  }
`;

const FormCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  box-shadow: 8px 8px 0px ${({ theme }) => theme.colors.border};
  padding: 1.5rem;
  min-height: 320px;
  overflow: hidden;
  position: relative;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.foreground};
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 0.5rem;
`;

const RadioButtonLabel = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid ${({ theme, $checked }) => ($checked ? theme.colors.foreground : theme.colors.border)};
  background-color: ${({ theme, $checked }) => ($checked ? theme.colors.foreground : theme.colors.background)};
  color: ${({ theme, $checked }) => ($checked ? theme.colors.background : theme.colors.foreground)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: ${({ $checked }) => ($checked ? 'none' : 'translate(-2px, -2px)')};
    box-shadow: ${({ $checked, theme }) => ($checked ? 'none' : `4px 4px 0px ${theme.colors.border}`)};
  }

  input {
    display: none;
  }
`;

const DropzoneContainer = styled.div<{ $isDragActive: boolean; $disabled: boolean }>`
  border: 2px dashed ${({ theme, $isDragActive }) => ($isDragActive ? theme.colors.foreground : theme.colors.border)};
  background-color: ${({ theme, $isDragActive }) => ($isDragActive ? theme.colors.secondary : theme.colors.background)};
  padding: 2.5rem;
  text-align: center;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme, $disabled }) => ($disabled ? theme.colors.border : theme.colors.foreground)};
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SummaryBox = styled.div`
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 2px solid ${({ theme }) => theme.colors.border};
`;

const ActionFooter = styled.div`
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// --- ICONS ---
const ChevronBackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
);
const ChevronForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m0-6l-3 3m3-3l3 3" /></svg>
);

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Vehicles', 'Books', 'Music', 'Toys', 'Art', 'Collectibles', 'Other'];
const CONDITIONS = [{ value: 'NEW', label: 'New' }, { value: 'LIKE_NEW', label: 'Like New' }, { value: 'GOOD', label: 'Good' }, { value: 'FAIR', label: 'Fair' }, { value: 'POOR', label: 'Poor' }];
const LISTING_TYPES = [{ value: 'FIXED_PRICE', label: 'Fixed Price' }, { value: 'AUCTION', label: 'Auction' }, { value: 'BEST_OFFER', label: 'Best Offer' }];
const STEPS = ['Details', 'Media', 'Pricing', 'Review'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
};

interface FormState {
  title: string;
  description: string;
  category: string;
  condition: string;
  tags: string[];
  tagInput: string;
  images: File[];
  listingType: string;
  price: string;
  startingBid: string;
  minBidIncrement: string;
  auctionEnd: string;
  location: string;
}

const initialState: FormState = {
  title: '', description: '', category: '', condition: 'GOOD', tags: [], tagInput: '', images: [], listingType: 'FIXED_PRICE', price: '', startingBid: '', minBidIncrement: '', auctionEnd: '', location: '',
};

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <StepIndicatorContainer>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StepCircle $active={i <= current}>{i + 1}</StepCircle>
            <StepLabel $active={i <= current}>{label}</StepLabel>
          </div>
          {i < steps.length - 1 && <StepLine $active={i < current} />}
        </div>
      ))}
    </StepIndicatorContainer>
  );
}

function DetailsStep({ form, onChange }: { form: FormState; onChange: (patch: Partial<FormState>) => void }) {
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = form.tagInput.trim().replace(/,/g, '');
      if (val && !form.tags.includes(val)) onChange({ tags: [...form.tags, val], tagInput: '' });
    }
  };

  const removeTag = (tag: string) => onChange({ tags: form.tags.filter((t) => t !== tag) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Input label="Title" placeholder="What are you selling?" value={form.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={120} />
      <Input textarea label="Description" placeholder="Describe your item in detail..." value={form.description} onChange={(e) => onChange({ description: e.target.value })} rows={5} />
      <div>
        <Label>Category</Label>
        <StyledSelect value={form.category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </StyledSelect>
      </div>
      <div>
        <Label>Condition</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CONDITIONS.map((c) => (
            <RadioButtonLabel key={c.value} $checked={form.condition === c.value}>
              <input type="radio" name="condition" value={c.value} checked={form.condition === c.value} onChange={(e) => onChange({ condition: e.target.value })} />
              {c.label}
            </RadioButtonLabel>
          ))}
        </div>
      </div>
      <div>
        <Label>Tags</Label>
        <Input placeholder="Type a tag and press Enter or comma" value={form.tagInput} onChange={(e) => onChange({ tagInput: e.target.value })} onKeyDown={handleTagKeyDown} />
        {form.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {form.tags.map((tag) => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', textTransform: 'uppercase' }}>
                {tag}
                <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><CloseIcon /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaStep({ images, onImagesChange }: { images: File[]; onImagesChange: (files: File[]) => void }) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = 10 - images.length;
      if (remaining <= 0) { toast.error('Maximum 10 images allowed'); return; }
      onImagesChange([...images, ...accepted.slice(0, remaining)]);
    },
    [images, onImagesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxSize: 10 * 1024 * 1024, disabled: images.length >= 10,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DropzoneContainer {...getRootProps()} $isDragActive={isDragActive} $disabled={images.length >= 10}>
        <input {...getInputProps()} />
        <div style={{ color: 'var(--muted)', display: 'flex', justifyContent: 'center' }}><UploadIcon /></div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase' }}>{isDragActive ? 'Drop images here' : 'Drag & drop images, or click to select'}</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>PNG, JPG, WebP up to 10MB each. Max 10 images.</p>
      </DropzoneContainer>

      <p style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>{images.length} / 10 images uploaded</p>

      {previews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
          {previews.map((url, i) => (
            <div key={url} style={{ position: 'relative', aspectRatio: '1', border: '2px solid var(--border)', overflow: 'hidden' }}>
              <img src={url} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => onImagesChange(images.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '1.5rem', height: '1.5rem', backgroundColor: 'var(--foreground)', color: 'var(--background)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingStep({ form, onChange }: { form: FormState; onChange: (patch: Partial<FormState>) => void }) {
  const isAuction = form.listingType === 'AUCTION';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <Label>Listing Type</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {LISTING_TYPES.map((lt) => (
            <RadioButtonLabel key={lt.value} $checked={form.listingType === lt.value}>
              <input type="radio" name="listingType" value={lt.value} checked={form.listingType === lt.value} onChange={(e) => onChange({ listingType: e.target.value })} />
              {lt.label}
            </RadioButtonLabel>
          ))}
        </div>
      </div>

      {!isAuction && <Input label="Price (₹)" type="number" placeholder="0.00" value={form.price} onChange={(e) => onChange({ price: e.target.value })} min="0" step="0.01" />}

      {isAuction && (
        <>
          <Input label="Starting Bid (₹)" type="number" placeholder="0.00" value={form.startingBid} onChange={(e) => onChange({ startingBid: e.target.value })} min="0" step="0.01" />
          <Input label="Minimum Bid Increment (₹)" type="number" placeholder="1.00" value={form.minBidIncrement} onChange={(e) => onChange({ minBidIncrement: e.target.value })} min="0" step="0.01" />
          <div>
            <Label>Auction End Date & Time</Label>
            <input type="datetime-local" value={form.auctionEnd} onChange={(e) => onChange({ auctionEnd: e.target.value })} min={new Date().toISOString().slice(0, 16)} style={{ width: '100%', padding: '0.75rem 1rem', fontFamily: 'inherit', fontWeight: 600, border: '2px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', outline: 'none' }} />
          </div>
        </>
      )}

      <Input label="Location (optional)" placeholder="City, State, or Address" value={form.location} onChange={(e) => onChange({ location: e.target.value })} />
    </div>
  );
}

function ReviewStep({ form, onGenerateDescription, onSuggestPrice, isGeneratingDesc, isSuggestingPrice, suggestedPrice }: { form: FormState; onGenerateDescription: () => void; onSuggestPrice: () => void; isGeneratingDesc: boolean; isSuggestingPrice: boolean; suggestedPrice: { min: number; max: number } | null }) {
  const conditionLabel: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };
  const listingTypeLabel: Record<string, string> = { FIXED_PRICE: 'Fixed Price', AUCTION: 'Auction', BEST_OFFER: 'Best Offer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SummaryGrid>
        <SummaryBox><Label>Title</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.title || '—'}</p></SummaryBox>
        <SummaryBox><Label>Category</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.category || '—'}</p></SummaryBox>
        <SummaryBox><Label>Condition</Label><p style={{ fontWeight: 800, margin: 0 }}>{conditionLabel[form.condition] ?? form.condition}</p></SummaryBox>
        <SummaryBox><Label>Listing Type</Label><p style={{ fontWeight: 800, margin: 0 }}>{listingTypeLabel[form.listingType] ?? form.listingType}</p></SummaryBox>
        {form.listingType !== 'AUCTION' && <SummaryBox><Label>Price</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.price ? `₹${parseFloat(form.price)}` : '—'}</p></SummaryBox>}
        {form.listingType === 'AUCTION' && (
          <>
            <SummaryBox><Label>Starting Bid</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.startingBid ? `₹${parseFloat(form.startingBid)}` : '—'}</p></SummaryBox>
            <SummaryBox><Label>Min Increment</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.minBidIncrement ? `₹${parseFloat(form.minBidIncrement)}` : '—'}</p></SummaryBox>
          </>
        )}
        <SummaryBox><Label>Location</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.location || '—'}</p></SummaryBox>
        <SummaryBox><Label>Images</Label><p style={{ fontWeight: 800, margin: 0 }}>{form.images.length} image(s)</p></SummaryBox>
      </SummaryGrid>

      {form.tags.length > 0 && (
        <div>
          <Label>Tags</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{form.tags.map(tag => <Badge key={tag} size="sm">{tag}</Badge>)}</div>
        </div>
      )}

      {form.description && (
        <SummaryBox>
          <Label>Description</Label>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', margin: 0 }}>{form.description}</p>
        </SummaryBox>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={onGenerateDescription} isLoading={isGeneratingDesc} disabled={!form.title || !form.category}>AI Generate Description</Button>
        <Button variant="outline" onClick={onSuggestPrice} isLoading={isSuggestingPrice} disabled={!form.title || !form.category}>AI Suggest Price</Button>
      </div>

      {suggestedPrice && (
        <div style={{ padding: '1rem', border: '2px solid var(--foreground)', backgroundColor: 'var(--secondary)' }}>
          <p style={{ fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Suggested price range: <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{suggestedPrice.min} – ₹{suggestedPrice.max}</span></p>
        </div>
      )}
    </div>
  );
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<ApiResponse<{ url: string }>>('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  const url = res.data.data?.url;
  if (!url) throw new Error('Image upload failed');
  return url;
}

export default function CreateListingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<{ min: number; max: number } | null>(null);

  const updateForm = useCallback((patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch })), []);

  const createProductMutation = useMutation({
    mutationFn: (input: CreateProductInput) => products.createProduct(input),
    onSuccess: (res) => { toast.success('Listing published!'); navigate(`/products/${res.data?.id}`); },
    onError: (err: Error) => { toast.error(err.message || 'Failed to create listing'); setIsSubmitting(false); },
  });

  const handleNext = useCallback(() => {
    if (step === 0) {
      if (!form.title.trim()) { toast.error('Please enter a title'); return; }
      if (!form.description.trim()) { toast.error('Please enter a description'); return; }
      if (!form.category) { toast.error('Please select a category'); return; }
    }
    if (step === 2) {
      if (form.listingType !== 'AUCTION' && !form.price) { toast.error('Please enter a price'); return; }
      if (form.listingType === 'AUCTION') {
        if (!form.startingBid) { toast.error('Please enter a starting bid'); return; }
        if (!form.auctionEnd) { toast.error('Please set an auction end time'); return; }
      }
    }
    setDirection(1); setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, form]);

  const handleBack = useCallback(() => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); }, []);

  const handlePublish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (form.images.length > 0) imageUrls = await Promise.all(form.images.map(uploadImage));

      const input: CreateProductInput = { title: form.title.trim(), description: form.description.trim(), category: form.category, condition: form.condition, listingType: form.listingType, tags: form.tags, imageUrls, location: form.location.trim() || undefined };
      if (form.listingType === 'AUCTION') { input.startingBid = parseFloat(form.startingBid); input.minBidIncrement = form.minBidIncrement ? parseFloat(form.minBidIncrement) : undefined; input.auctionEnd = new Date(form.auctionEnd).toISOString(); } else { input.price = parseFloat(form.price); }

      createProductMutation.mutate(input);
    } catch { toast.error('Failed to upload images.'); setIsSubmitting(false); }
  }, [form, createProductMutation]);

  const handleGenerateDescription = useCallback(async () => {
    if (!form.title || !form.category) return;
    setIsGeneratingDesc(true);
    try {
      const res = await ai.generateDescription({
        title: form.title,
        category: form.category,
        condition: form.condition,
        features: form.tags.length > 0 ? form.tags : undefined
      });
      if (res.data) { updateForm({ description: res.data }); toast.success('Description generated'); }
    } catch { toast.error('Failed to generate description'); } finally { setIsGeneratingDesc(false); }
  }, [form.title, form.category, form.condition, form.tags, updateForm]);

  const handleSuggestPrice = useCallback(async () => {
    if (!form.title || !form.category) return;
    setIsSuggestingPrice(true);
    try {
      const res = await ai.suggestPrice({ title: form.title, description: form.description, category: form.category, condition: form.condition });
      if (res.data) { setSuggestedPrice({ min: res.data.minPrice, max: res.data.maxPrice }); toast.success('Price suggestion ready'); }
    } catch { toast.error('Failed to suggest price'); } finally { setIsSuggestingPrice(false); }
  }, [form.title, form.description, form.category, form.condition]);

  const isLastStep = step === STEPS.length - 1;

  return (
    <PageContainer>
      <PageTitle>Create Listing</PageTitle>
      <Subtitle>Fill in the details to list your item</Subtitle>

      <StepIndicator current={step} steps={STEPS} />

      <FormCard>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            {step === 0 && <DetailsStep form={form} onChange={updateForm} />}
            {step === 1 && <MediaStep images={form.images} onImagesChange={(files) => updateForm({ images: files })} />}
            {step === 2 && <PricingStep form={form} onChange={updateForm} />}
            {step === 3 && <ReviewStep form={form} onGenerateDescription={handleGenerateDescription} onSuggestPrice={handleSuggestPrice} isGeneratingDesc={isGeneratingDesc} isSuggestingPrice={isSuggestingPrice} suggestedPrice={suggestedPrice} />}
          </motion.div>
        </AnimatePresence>
      </FormCard>

      <ActionFooter>
        <Button variant="outline" onClick={handleBack} disabled={step === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ChevronBackIcon /> Back
        </Button>

        {isLastStep ? (
          <Button variant="primary" onClick={handlePublish} isLoading={isSubmitting}>Publish Listing</Button>
        ) : (
          <Button variant="primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Next <ChevronForwardIcon />
          </Button>
        )}
      </ActionFooter>
    </PageContainer>
  );
}
