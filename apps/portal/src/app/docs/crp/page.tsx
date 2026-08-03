import type { Metadata } from 'next'
import Link from 'next/link'
import { CrpVisualizer } from './components/CrpVisualizer'
import { CrpSimulator } from './components/CrpSimulator'
import { CrpDiagnostics } from './components/CrpDiagnostics'
import { ArrowLeft, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Critical Rendering Path (CRP) Visualizer & Optimizer | Systems Portal',
  description:
    'Interactive visualizer and simulator for understanding and optimizing the Critical Rendering Path: DOM, CSSOM, Render Tree, Layout, and Paint.',
}

export default function CrpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to System Documentation
        </Link>
        <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Browser Performance Engine v2.4
        </span>
      </div>

      {/* Main Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Browser Engineering & Performance Module
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Critical Rendering Path (CRP)
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-4xl leading-relaxed">
          The Critical Rendering Path is the sequence of steps the browser engine executes to
          convert HTML, CSS, and JavaScript into rendered pixels on the screen. Optimizing this
          sequence minimizes Time to First Render and eliminates jank during 60 FPS interactions.
        </p>
      </div>

      {/* Interactive Flowchart & Stage Inspector */}
      <CrpVisualizer />

      {/* Live Interactive Laboratory & Simulator */}
      <CrpSimulator />

      {/* Optimization Rules & Best Practices */}
      <CrpDiagnostics />
    </div>
  )
}
