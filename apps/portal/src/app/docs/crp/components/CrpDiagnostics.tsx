'use client'

import React from 'react'
import { CheckCircle2, Lightbulb } from 'lucide-react'

export function CrpDiagnostics() {
  const optimizationRules = [
    {
      title: 'Minimize Critical Resources',
      impact: 'High',
      recommendation:
        'Defer non-critical scripts with async/defer, inline critical CSS, and eliminate unnecessary head scripts.',
      beforeCode: `<script src="analytics.js"></script>\n<link rel="stylesheet" href="print.css">`,
      afterCode: `<script src="analytics.js" defer></script>\n<link rel="stylesheet" href="print.css" media="print">`,
    },
    {
      title: 'Optimize Critical Path Length',
      impact: 'High',
      recommendation:
        'Prioritize loading essential CSS and JS to reduce required HTTP roundtrips before First Contentful Paint.',
      beforeCode: `HTML -> CSS File (100KB) -> JS File (200KB) -> Render`,
      afterCode: `HTML (with Critical Inline CSS) -> Parallel JS Defer -> First Paint`,
    },
    {
      title: 'Reduce DOM Node Count',
      impact: 'Medium',
      recommendation:
        'Keep DOM trees under 1,500 total nodes and under 32 levels deep to prevent memory overhead and reflow delays.',
      beforeCode: `<div><div><div><div><span>Deeply nested markup</span></div></div></div></div>`,
      afterCode: `<span class="flex-item">Flattened modern layout structure</span>`,
    },
    {
      title: 'Simplify CSS Selector Specificity',
      impact: 'Medium',
      recommendation:
        'Prefer simple single-class selectors over deep multi-level ancestor selectors to minimize matching cost.',
      beforeCode: `body #app .sidebar .nav-list li.active a.link { ... }`,
      afterCode: `.nav-link-active { ... }`,
    },
  ]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Critical Rendering Path Optimization Playbook
        </h3>
        <p className="text-xs text-slate-400">
          Proven architectural strategies to shorten critical path length, prevent render blocking,
          and maintain 60 FPS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {optimizationRules.map((rule, idx) => (
          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {rule.title}
              </h4>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {rule.impact} Impact
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{rule.recommendation}</p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded border border-rose-950/60 font-mono text-[11px] text-rose-300 overflow-x-auto">
                <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block mb-1">
                  Unoptimized Pattern
                </span>
                <code>{rule.beforeCode}</code>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-emerald-950/60 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block mb-1">
                  Optimized CRP Pattern
                </span>
                <code>{rule.afterCode}</code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
