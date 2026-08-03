import { GlassCard } from '@repo/ui/GlassCard'
import { Archive, Download, FileText, Search, ShieldCheck, Upload } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Safety Archive | Arch OS',
  description: 'Archived Inductions, SOPs, CODs, and Safety Compliance Documents.',
}

interface ArchivedDocument {
  id: string
  title: string
  code: string
  category: 'Inductions' | 'SOP' | 'COD' | 'Compliance'
  version: string
  effectiveDate: string
  fileSize: string
  status: 'active' | 'archived' | 'pending_review'
}

const SAMPLE_SAFETY_ARCHIVE: ArchivedDocument[] = [
  {
    id: 'doc-s01',
    title: 'Site General Safety & Mining Induction 2026',
    code: 'IND-SAF-2026-V2',
    category: 'Inductions',
    version: '2.4',
    effectiveDate: '2026-01-15',
    fileSize: '4.2 MB',
    status: 'active',
  },
  {
    id: 'doc-s02',
    title: 'Standard Operating Procedure: Heavy Rig Isolation & Lockout',
    code: 'SOP-ENG-089',
    category: 'SOP',
    version: '4.1',
    effectiveDate: '2025-11-01',
    fileSize: '2.8 MB',
    status: 'active',
  },
  {
    id: 'doc-s03',
    title: 'Code of Differences (COD) - Open Cut Mining Operations',
    code: 'COD-MIN-2025-A',
    category: 'COD',
    version: '1.0',
    effectiveDate: '2025-06-20',
    fileSize: '6.1 MB',
    status: 'active',
  },
  {
    id: 'doc-s04',
    title: 'Hazardous Chemical Handling & Environmental Containment SOP',
    code: 'SOP-ENV-014',
    category: 'SOP',
    version: '3.0',
    effectiveDate: '2025-09-12',
    fileSize: '1.9 MB',
    status: 'active',
  },
  {
    id: 'doc-s05',
    title: 'Contractor Safety Induction & Permit Requirements',
    code: 'IND-CON-2026-A',
    category: 'Inductions',
    version: '1.2',
    effectiveDate: '2026-02-01',
    fileSize: '3.5 MB',
    status: 'active',
  },
]

export default function SafetyArchivePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-arch-text-primary flex items-center gap-2">
            <Archive className="w-5 h-5 text-red-400" />
            Safety Document Archive
          </h2>
          <p className="text-xs text-arch-text-muted mt-0.5">
            Secure vault for official Safety Inductions, SOPs, CODs, and Compliance Records
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-arch-text-primary border border-arch-border transition-colors text-sm font-medium">
          <Upload className="w-4 h-4 text-arch-text-muted" />
          Upload Document
        </button>
      </div>

      {/* Filter / Search Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-arch-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Inductions, SOPs, CODs by title or document code..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary placeholder:text-arch-text-muted focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['All', 'Inductions', 'SOP', 'COD', 'Compliance'].map((cat, i) => (
              <button
                key={cat}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  i === 0
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-white/5 border-arch-border text-arch-text-muted hover:text-arch-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Document List */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-arch-border-subtle pb-3">
          <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
            Archived Safety Records ({SAMPLE_SAFETY_ARCHIVE.length})
          </h3>
          <span className="text-xs text-arch-text-muted">Encrypted Vault Storage</span>
        </div>

        <div className="divide-y divide-arch-border-subtle">
          {SAMPLE_SAFETY_ARCHIVE.map((doc) => (
            <div
              key={doc.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 flex-shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-300">{doc.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-arch-text-secondary font-medium">
                      {doc.category}
                    </span>
                    <span className="text-xs text-arch-text-muted">v{doc.version}</span>
                  </div>
                  <h4 className="text-sm font-medium text-arch-text-primary mt-0.5">{doc.title}</h4>
                  <p className="text-xs text-arch-text-muted mt-0.5">
                    Effective: {doc.effectiveDate} • Size: {doc.fileSize}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
                <button
                  title="Download File"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-arch-text-muted hover:text-arch-text-primary transition-colors border border-arch-border"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
