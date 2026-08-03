'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard } from '@repo/ui/GlassCard'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/components/ui/button'
import {
  Search,
  User,
  BadgeIcon as IdCard,
  Briefcase,
  MapPin,
  CalendarClock,
  Stethoscope,
  QrCode,
  Printer,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  searchPersonnel,
  getPersonnelDetail,
  printCardForPersonnel,
  bulkPrintCardsForPersonnel,
  getCardTemplates,
} from './actions'
import type { PersonnelSearchResult, PersonnelDetail } from './actions'
import { QRCodeSection } from './qr-section'
import { Checkbox } from '@repo/ui/components/Checkbox'

function getInitials(firstName: string, surname: string): string {
  return `${(firstName ?? '')[0] ?? ''}${(surname ?? '')[0] ?? ''}`.toUpperCase()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ExpiryPill({ date }: { date: string | null }) {
  if (!date) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-50/70 border-gray-200/50 text-gray-500">
        Not set
      </span>
    )
  }

  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50/70 border-red-200/50 text-red-700">
        <AlertCircle className="w-3 h-3" />
        Expired
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50/70 border-amber-200/50 text-amber-700">
        <Clock className="w-3 h-3" />
        {days}d remaining
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-accent-green/10 border-accent-green/20 text-accent-green">
      <CheckCircle2 className="w-3 h-3" />
      {days}d remaining
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
        isActive
          ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
          : 'bg-amber-50/70 border-amber-200/50 text-amber-700'
      )}
    >
      {status}
    </span>
  )
}

function DetailRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-arch-border-default/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-arch-surface-tertiary flex items-center justify-center text-arch-text-muted shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-arch-text-muted font-medium uppercase tracking-wider">{label}</p>
        {children ?? <p className="text-sm text-arch-text-primary truncate">{value ?? '—'}</p>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main View                                                          */
/* ------------------------------------------------------------------ */

interface CardActionsViewProps {
  initialQuery: string
  initialSelectedId: string
}

export function CardActionsView({ initialQuery, initialSelectedId }: CardActionsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<PersonnelSearchResult[]>([])
  const [selectedId, setSelectedId] = useState(initialSelectedId)
  const [detail, setDetail] = useState<PersonnelDetail | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [bulkPrinting, setBulkPrinting] = useState(false)
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string; background: string | null }>
  >([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  /* ── Search ── */

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    // Optional: Keep selection, or clear it if you want. Let's keep it.
    try {
      const res = await searchPersonnel(q)
      setResults(res)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (value.trim()) {
          params.set('q', value.trim())
        } else {
          params.delete('q')
        }
        params.delete('selected')
        router.replace(`?${params.toString()}`, { scroll: false })
        doSearch(value)
      }, 300)
    },
    [router, searchParams, doSearch]
  )

  /* ── Detail selection ── */

  const selectPersonnel = useCallback(
    async (id: string) => {
      setSelectedId(id)
      setLoadingDetail(true)
      const params = new URLSearchParams(searchParams.toString())
      params.set('selected', id)
      router.replace(`?${params.toString()}`, { scroll: false })
      try {
        const d = await getPersonnelDetail(id)
        setDetail(d)
      } catch {
        setDetail(null)
      } finally {
        setLoadingDetail(false)
      }
    },
    [router, searchParams]
  )

  /* ── Print ── */

  const handlePrint = useCallback(async () => {
    if (!selectedId) return
    setPrinting(true)
    try {
      const result = await printCardForPersonnel(selectedId, selectedTemplateId || undefined)
      if (result.printer) {
        toast.success(`Print job queued — submitted to ${result.printer.cups_name}`)
      } else {
        toast.info('No printer available — job queued for later processing')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Print failed')
    } finally {
      setPrinting(false)
    }
  }, [selectedId, selectedTemplateId])

  const toggleBulkSelection = useCallback((id: string) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkPrint = useCallback(async () => {
    if (selectedForBulk.size === 0) return
    setBulkPrinting(true)
    try {
      const results = await bulkPrintCardsForPersonnel(
        Array.from(selectedForBulk),
        selectedTemplateId || undefined
      )
      const successes = results.filter((r) => r.status === 'success').length
      const errors = results.filter((r) => r.status === 'error').length

      if (successes > 0 && errors === 0) {
        toast.success(`Successfully queued ${successes} print jobs`)
        setSelectedForBulk(new Set()) // clear selection on success
      } else if (successes > 0 && errors > 0) {
        toast.warning(`Queued ${successes} jobs, but ${errors} failed`)
      } else {
        toast.error(`Failed to queue any jobs (${errors} failed)`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk print failed')
    } finally {
      setBulkPrinting(false)
    }
  }, [selectedForBulk, selectedTemplateId])

  /* ── Initial load ── */

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      doSearch(initialQuery)
    }
    if (initialSelectedId) {
      selectPersonnel(initialSelectedId)
    }
    getCardTemplates()
      .then((res) => {
        setTemplates(res)
        if (res.length > 0) {
          setSelectedTemplateId(res[0]?.id ?? '')
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount
  }, [])

  /* ── Render ── */

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Left Panel: Search + Results ── */}
      <div className="lg:col-span-2 space-y-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-3 border-b border-arch-border-default">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arch-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by name or ID number..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-arch-surface-secondary border border-arch-border-default text-sm text-arch-text-primary placeholder:text-arch-text-muted outline-none focus:border-arch-accent-charcoal transition-colors"
                aria-label="Search personnel"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete('q')
                    params.delete('selected')
                    router.replace(`?${params.toString()}`, { scroll: false })
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-arch-text-muted hover:text-arch-text-primary"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {selectedForBulk.size > 0 && (
            <div className="p-3 border-b border-arch-border-default bg-arch-accent-charcoal/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-medium text-arch-text-primary">
                {selectedForBulk.size} selected for bulk print
              </span>
              <div className="flex items-center gap-3">
                {templates.length > 0 && (
                  <select
                    className="h-8 rounded-md bg-arch-surface-primary border border-arch-border-default text-xs text-arch-text-primary outline-none px-2 focus:border-arch-accent-charcoal"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  size="sm"
                  onClick={handleBulkPrint}
                  disabled={bulkPrinting}
                  className="h-8 gap-1.5"
                >
                  {bulkPrinting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                  Bulk Print
                </Button>
              </div>
            </div>
          )}

          <div className="divide-y divide-[var(--border-default)]/50" data-testid="search-results">
            {searching && (
              <div className="flex items-center justify-center py-8 text-arch-text-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Searching...
              </div>
            )}

            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-arch-text-muted">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No personnel found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            )}

            {!searching &&
              results.map((person) => (
                <div
                  key={person.id}
                  className={cn(
                    'flex items-center w-full px-4 transition-colors hover:bg-arch-surface-tertiary group',
                    selectedId === person.id && 'bg-arch-accent-charcoal/5'
                  )}
                >
                  <div className="py-3 pr-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedForBulk.has(person.id)}
                      onChange={() => toggleBulkSelection(person.id)}
                      aria-label={`Select ${person.first_name} for bulk print`}
                    />
                  </div>
                  <button
                    onClick={() => selectPersonnel(person.id)}
                    className="flex-1 text-left py-3 flex items-center gap-3 min-w-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-arch-surface-tertiary flex items-center justify-center text-xs font-semibold text-arch-text-muted shrink-0">
                      {getInitials(person.first_name, person.surname)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-arch-text-primary truncate">
                        {person.first_name} {person.surname}
                      </p>
                      <p className="text-xs text-arch-text-muted truncate">
                        {person.job_title ?? '—'}
                        {person.area && ` · ${person.area}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status={person.status} />
                      <ChevronRight className="w-4 h-4 text-arch-text-muted group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>
              ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Right Panel: Detail ── */}
      <div className="lg:col-span-3 space-y-4">
        {loadingDetail && (
          <GlassCard className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-arch-text-muted" />
          </GlassCard>
        )}

        {!loadingDetail && !detail && (
          <GlassCard className="flex flex-col items-center justify-center py-16 text-arch-text-muted">
            <User className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Select an employee</p>
            <p className="text-xs">Search and select a person to view their details</p>
          </GlassCard>
        )}

        {!loadingDetail && detail && (
          <div data-testid="personnel-detail">
            {/* Photo + Name Header */}
            <GlassCard>
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-xl bg-arch-surface-tertiary overflow-hidden shrink-0 flex items-center justify-center relative">
                  {detail.photo_signed_url ? (
                    <Image
                      src={detail.photo_signed_url}
                      alt={`${detail.first_name} ${detail.surname}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-arch-text-muted">
                      {getInitials(detail.first_name, detail.surname)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-arch-text-primary">
                        {detail.first_name} {detail.surname}
                      </h2>
                      <p className="text-sm text-arch-text-secondary">
                        {detail.job_title ?? 'No title'}
                      </p>
                    </div>
                    <StatusPill status={detail.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-arch-text-muted">
                    <span className="font-mono">#{detail.emp_code}</span>
                    {detail.area && (
                      <>
                        <span>·</span>
                        <span>{detail.area}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
            {/* Info Fields */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50">
                <h3 className="font-medium text-arch-text-primary">Personal Details</h3>
              </div>
              <div className="px-4">
                <DetailRow
                  icon={<IdCard className="w-4 h-4" />}
                  label="ID Number"
                  value={detail.id_number}
                />
                <DetailRow
                  icon={<Briefcase className="w-4 h-4" />}
                  label="Job Title"
                  value={detail.job_title}
                />
                <DetailRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Area / Zone"
                  value={detail.area}
                />
                <DetailRow icon={<Stethoscope className="w-4 h-4" />} label="Medical Expiry">
                  <ExpiryPill date={detail.medical_expiry} />
                  <p className="text-xs text-arch-text-muted mt-0.5">
                    {formatDate(detail.medical_expiry)}
                  </p>
                </DetailRow>
                <DetailRow icon={<CalendarClock className="w-4 h-4" />} label="Induction Expiry">
                  <ExpiryPill date={detail.induction_expiry} />
                  <p className="text-xs text-arch-text-muted mt-0.5">
                    {formatDate(detail.induction_expiry)}
                  </p>
                </DetailRow>
              </div>
            </GlassCard>

            {/* QR Code */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex items-center justify-between">
                <h3 className="font-medium text-arch-text-primary flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-arch-text-muted" />
                  Access Badge
                </h3>
                {detail.badge && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
                      detail.badge.is_active
                        ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
                        : 'bg-red-50/70 border-red-200/50 text-red-700'
                    )}
                  >
                    {detail.badge.is_active ? 'Active' : 'Revoked'}
                  </span>
                )}
              </div>
              <div className="p-6 flex flex-col items-center gap-3">
                <div data-testid="qr-section">
                  {detail.badge?.qr_code ? (
                    <QRCodeSection data={detail.badge.qr_code} />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-arch-text-muted">
                      <QrCode className="w-12 h-12 opacity-30" />
                      <p className="text-sm">No badge assigned</p>
                    </div>
                  )}
                  {detail.issued_card && (
                    <div className="flex items-center gap-4 text-xs text-arch-text-muted">
                      <span>
                        Issued card:
                        <span className="text-arch-text-primary ml-1">
                          {detail.issued_card.status}
                        </span>
                      </span>
                      {detail.issued_card.expires_at && (
                        <span>
                          Expires:
                          <span className="text-arch-text-primary ml-1">
                            {formatDate(detail.issued_card.expires_at)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Print Button */}
            <div className="flex items-center justify-end gap-3">
              {templates.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-arch-text-muted">Template:</label>
                  <select
                    className="h-9 rounded-md bg-arch-surface-primary border border-arch-border-default text-sm text-arch-text-primary outline-none px-3 focus:border-arch-accent-charcoal"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button onClick={handlePrint} disabled={printing} className="gap-2 h-9">
                {printing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {printing ? 'Queuing...' : 'Print Card'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
