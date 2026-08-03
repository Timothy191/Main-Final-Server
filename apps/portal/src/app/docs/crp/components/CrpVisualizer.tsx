'use client'

import React, { useState } from 'react'
import {
  FileCode,
  Palette,
  Layers,
  Maximize2,
  Paintbrush,
  ArrowRight,
  AlertTriangle,
  Info,
  Clock,
  Cpu,
} from 'lucide-react'

export type CrpStageId = 'dom' | 'cssom' | 'rendertree' | 'layout' | 'paint'

interface StageDetail {
  id: CrpStageId
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  isIncremental: boolean
  isRenderBlocking: boolean
  keyTakeaway: string
  description: string
  steps: string[]
  metrics: { label: string; value: string; hint: string }[]
}

const STAGES: StageDetail[] = [
  {
    id: 'dom',
    title: 'Document Object Model (DOM)',
    subtitle: 'Incremental HTML parsing & node hierarchy construction',
    icon: FileCode,
    isIncremental: true,
    isRenderBlocking: false,
    keyTakeaway:
      'HTML parsing is incremental. Bytes are converted to tokens, nodes, and linked into a hierarchy as data streams in.',
    description:
      'The browser parses raw HTML bytes received over HTTP into tokens, converts those tokens into nodes, and constructs the DOM tree based on tag nesting hierarchy.',
    steps: [
      'Bytes -> Characters: Convert raw HTML byte stream to string characters based on encoding (UTF-8).',
      'Tokens: Identify start/end tags, attributes, and text values (e.g. <html>, <body>, <div>).',
      'Nodes: Wrap tokens with properties and rules into object representations.',
      'DOM Tree Construction: Link parent-child nodes based on nested startTag / endTag positions.',
    ],
    metrics: [
      {
        label: 'Processing',
        value: 'Incremental / Streaming',
        hint: 'Renders partial nodes as received',
      },
      {
        label: 'Render Blocking',
        value: 'No (HTML itself)',
        hint: 'Scripts can halt parsing unless async/defer',
      },
      {
        label: 'Key Bottleneck',
        value: 'Excessive DOM Node Count',
        hint: 'Large DOM trees slow down subsequent layout & paint',
      },
    ],
  },
  {
    id: 'cssom',
    title: 'CSS Object Model (CSSOM)',
    subtitle: 'Style rule cascade resolution & selector matching',
    icon: Palette,
    isIncremental: false,
    isRenderBlocking: true,
    keyTakeaway:
      'CSS is render-blocking. Unlike HTML, CSSOM cannot be processed incrementally because later rules can override earlier ones (Cascade).',
    description:
      'CSS rules are parsed to form the CSS Object Model tree. Because rules cascade, the browser must wait for all CSS files to finish downloading before building the Render Tree.',
    steps: [
      "Style Request: Initiated upon encountering <link rel='stylesheet'> or <style> tags.",
      'Tokenization & Node Creation: CSS rules are parsed into selectors, declarations, and values.',
      'Cascade Resolution: Styles descend down tree nodes, inheriting parent properties.',
      'Specificity Evaluation: Simple selectors (.foo) evaluate faster than deeply nested ancestors (.bar .foo).',
    ],
    metrics: [
      {
        label: 'Processing',
        value: 'Non-incremental',
        hint: 'Must wait for complete CSS file download',
      },
      {
        label: 'Render Blocking',
        value: 'Yes (Critical CSS)',
        hint: 'Blocks Render Tree construction until complete',
      },
      {
        label: 'Optimization Tip',
        value: 'Media Queries / Critical CSS',
        hint: "Mark non-critical CSS with media='print' or defer",
      },
    ],
  },
  {
    id: 'rendertree',
    title: 'Render Tree',
    subtitle: 'Combining DOM + CSSOM for visible content',
    icon: Layers,
    isIncremental: false,
    isRenderBlocking: false,
    keyTakeaway:
      'The Render Tree only captures visible elements. Elements with display: none and <head> content are completely excluded.',
    description:
      'The browser traverses the DOM tree starting from the root node and matches corresponding CSSOM rules to compute final computed styles for visible elements.',
    steps: [
      'Traverse DOM: Iterate through visible nodes starting from <html> and <body>.',
      'Filter Non-Visible Content: Skip <head>, <script>, <style>, and nodes with display: none.',
      'Attach CSSOM Rules: Compute exact computed styles (colors, font-size, visibility) for each visible node.',
      'Construct Render Nodes: Output styled render object nodes ready for geometry placement.',
    ],
    metrics: [
      { label: 'Includes Head?', value: 'No', hint: 'Metadata and script nodes are omitted' },
      {
        label: 'Includes display:none?',
        value: 'No',
        hint: 'Excluded entirely from Render Tree & Layout',
      },
      {
        label: 'Includes visibility:hidden?',
        value: 'Yes',
        hint: 'Occupies spatial layout, but invisible',
      },
    ],
  },
  {
    id: 'layout',
    title: 'Layout (Reflow)',
    subtitle: 'Viewport-based geometry & spatial position calculations',
    icon: Maximize2,
    isIncremental: false,
    isRenderBlocking: false,
    keyTakeaway:
      'Layout computes exact geometry (width, height, top, left). Reflows occur whenever DOM structure or box model properties change.',
    description:
      'The layout phase determines the exact vector geometry, width, height, and coordinates of every node in relation to the screen layout viewport.',
    steps: [
      "Viewport Setup: Measure viewport dimensions (<meta name='viewport' content='width=device-width'>).",
      'Box Model Computation: Calculate margins, borders, padding, and element widths/heights.',
      'Relative Positioning: Position elements relative to parent flow, flexboxes, or grids.',
      'Reflow Calculation: Triggered by orientation changes, window resizing, or DOM mutations.',
    ],
    metrics: [
      {
        label: 'Frame Budget',
        value: '16.6ms (60 FPS)',
        hint: 'Layout spikes >16ms cause frame drops / jank',
      },
      {
        label: 'Impact Factor',
        value: 'DOM Size & Box Mutators',
        hint: 'Animating width/height forces reflow',
      },
      {
        label: 'Best Practice',
        value: 'Batch DOM Updates',
        hint: 'Avoid synchronous layout thrashing',
      },
    ],
  },
  {
    id: 'paint',
    title: 'Paint & Composite',
    subtitle: 'Rasterizing pixels & compositing GPU layers',
    icon: Paintbrush,
    isIncremental: true,
    isRenderBlocking: false,
    keyTakeaway:
      'Painting converts layout boxes into actual screen pixels. Subsequent repaints target only affected dirty regions.',
    description:
      'The browser paints colors, borders, shadows, text, and images onto screen layers, then composites layers together for display.',
    steps: [
      'Layer Tree Creation: Group elements into composite layers (GPU accelerated elements, z-indexes).',
      'Rasterization: Draw vectors, text strings, gradients, and images into bitmap pixels.',
      'Dirty Region Repaint: Re-paint minimal changed regions on dynamic state updates.',
      'GPU Compositing: Combine painted layer bitmaps onto final frame buffer for display output.',
    ],
    metrics: [
      {
        label: 'Initial Load',
        value: 'Full Screen Paint',
        hint: 'Entire viewport painted on first render',
      },
      {
        label: 'Subsequent Renders',
        value: 'Dirty Rectangle Repaint',
        hint: 'Only repaints modified screen area',
      },
      {
        label: 'GPU Acceleration',
        value: 'transform & opacity',
        hint: 'Bypasses layout and paint during animations',
      },
    ],
  },
]

export function CrpVisualizer() {
  const [activeStage, setActiveStage] = useState<CrpStageId>('dom')
  const selectedStage = STAGES.find((s) => s.id === activeStage)
  const stage = selectedStage ?? STAGES[0]!

  return (
    <div className="w-full space-y-6">
      {/* Pipeline Navigation Header */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          Critical Rendering Path Flowchart
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAGES.map((s, idx) => {
            const Icon = s.icon
            const isActive = s.id === activeStage
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(s.id)}
                className={`relative flex flex-col items-start p-3.5 rounded-lg border text-left transition-all group ${
                  isActive
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                    : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-mono font-bold w-5 h-5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {s.isRenderBlocking && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-tight rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Blocking
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold truncate">{s.id.toUpperCase()}</span>
                </div>
                <span className="text-xs text-slate-400 line-clamp-1">{s.title.split('(')[0]}</span>

                {idx < STAGES.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600 pointer-events-none">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage Detail Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              {React.createElement(stage.icon, { className: 'w-6 h-6' })}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {stage.title}
              </h2>
              <p className="text-sm text-slate-400">{stage.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                stage.isIncremental
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              {stage.isIncremental ? 'Incremental Stream' : 'Non-Incremental (Atomic)'}
            </span>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                stage.isRenderBlocking
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {stage.isRenderBlocking ? 'Render Blocking' : 'Non-Blocking Phase'}
            </span>
          </div>
        </div>

        {/* Takeaway banner */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex items-start gap-3 text-slate-300 text-sm">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-emerald-300">Key Insight: </span>
            {stage.keyTakeaway}
          </div>
        </div>

        {/* Sub-steps & Technical Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Pipeline Execution Sequence
            </h4>
            <ul className="space-y-2.5">
              {stage.steps.map((step, idx) => {
                const parts = step.split(':')
                return (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="flex items-center justify-center text-[10px] font-mono font-bold w-4 h-4 rounded bg-slate-800 text-emerald-400 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>
                      <strong className="text-slate-100">{parts[0]}:</strong>
                      {parts.slice(1).join(':')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Performance Metrics & Characteristics
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {stage.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800/60 p-3 rounded-lg flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-400">{m.label}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{m.value}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{m.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
