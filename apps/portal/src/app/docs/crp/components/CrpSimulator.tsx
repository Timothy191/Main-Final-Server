'use client'

import React, { useState } from 'react'
import { Sliders, Zap, AlertCircle, CheckCircle2, Activity } from 'lucide-react'

export function CrpSimulator() {
  // Config state
  const [scriptMode, setScriptMode] = useState<'sync' | 'async' | 'defer'>('sync')
  const [useCriticalCss, setUseCriticalCss] = useState<boolean>(false)
  const [useNonBlockingMediaCss, setUseNonBlockingMediaCss] = useState<boolean>(false)
  const [nodeCount, setNodeCount] = useState<number>(1500)
  const [cssSpecificityLevel, setCssSpecificityLevel] = useState<'simple' | 'medium' | 'deep'>(
    'medium'
  )
  const [hasViewportMeta] = useState<boolean>(true)

  // Calculations based on simulation variables
  const blockingScripts = scriptMode === 'sync' ? 2 : 0
  const blockingCss = (useCriticalCss ? 0 : 1) + (useNonBlockingMediaCss ? 0 : 1)
  const totalBlockingResources = blockingScripts + blockingCss

  // Path length calculation (HTTP round trips required before FCP)
  const criticalPathLength = 1 + (blockingCss > 0 ? 1 : 0) + (scriptMode === 'sync' ? 1 : 0)

  // Parse & CSSOM estimation
  const baseParseTimeMs = (nodeCount / 1000) * 1.5
  const cssomTimeMs =
    blockingCss * 12 +
    (cssSpecificityLevel === 'deep' ? 8 : cssSpecificityLevel === 'medium' ? 3 : 1)
  const totalParseCssomMs = Number((baseParseTimeMs + cssomTimeMs).toFixed(1))

  // Layout geometry estimation
  const specificityFactor =
    cssSpecificityLevel === 'deep' ? 1.8 : cssSpecificityLevel === 'medium' ? 1.2 : 1.0
  const viewportFactor = hasViewportMeta ? 1.0 : 1.3
  const rawLayoutTimeMs = (nodeCount / 800) * 2.2 * specificityFactor * viewportFactor
  const layoutTimeMs = Number(rawLayoutTimeMs.toFixed(1))

  // Frame calculation (1000ms / frameTime = FPS)
  const frameBudgetMs = 16.67 // 60 FPS budget
  const frameDurationMs = Number((layoutTimeMs + 4.5).toFixed(1))
  const isJanky = frameDurationMs > frameBudgetMs
  const calculatedFps = Math.min(60, Math.max(10, Math.round(1000 / frameDurationMs)))

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Interactive CRP Performance Simulator
          </h3>
          <p className="text-xs text-slate-400">
            Adjust network resources, DOM complexity, and CSS delivery to analyze critical path
            metrics in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono font-bold ${
              isJanky
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>
              Target: {calculatedFps} FPS ({frameDurationMs}ms frame)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Script Loading Strategy */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex justify-between">
              <span>JavaScript Loading Strategy</span>
              <span className="text-emerald-400 font-mono text-xs">{scriptMode.toUpperCase()}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['sync', 'async', 'defer'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScriptMode(mode)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    scriptMode === mode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {mode === 'sync' ? 'Synchronous' : mode === 'async' ? 'async' : 'defer'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {scriptMode === 'sync' && 'Blocks HTML parser until downloaded and executed.'}
              {scriptMode === 'async' && 'Downloads in parallel, executes immediately when ready.'}
              {scriptMode === 'defer' &&
                'Downloads in parallel, executes after HTML parsing completes.'}
            </p>
          </div>

          {/* CSS Strategies */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              CSS Optimization Toggles
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs text-slate-200">Inline Critical CSS in &lt;head&gt;</span>
                <input
                  type="checkbox"
                  checked={useCriticalCss}
                  onChange={(e) => setUseCriticalCss(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/40 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs text-slate-200">
                  Non-blocking Print CSS (<code className="text-slate-400">media="print"</code>)
                </span>
                <input
                  type="checkbox"
                  checked={useNonBlockingMediaCss}
                  onChange={(e) => setUseNonBlockingMediaCss(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/40 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* DOM Depth Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                DOM Tree Complexity
              </span>
              <span className="font-mono text-emerald-400">{nodeCount.toLocaleString()} Nodes</span>
            </div>
            <input
              type="range"
              min={200}
              max={15000}
              step={300}
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <p className="text-[11px] text-slate-400">
              Higher node counts linearly increase DOM parsing, layout reflow, and repaint times.
            </p>
          </div>

          {/* Selector Specificity */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex justify-between">
              <span>CSS Selector Specificity</span>
              <span className="text-emerald-400 font-mono text-xs">
                {cssSpecificityLevel.toUpperCase()}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['simple', 'medium', 'deep'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setCssSpecificityLevel(lvl)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    cssSpecificityLevel === lvl
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {lvl === 'simple' ? '.class' : lvl === 'medium' ? '.card .title' : '.a .b .c .d'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Metrics Column */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Calculated Critical Path Telemetry
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">Critical Path Length</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {criticalPathLength}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Roundtrip HTTP requests
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Render-Blocking Assets
                </span>
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {totalBlockingResources}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  CSS & JS files blocking FCP
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">
                  DOM + CSSOM Construction
                </span>
                <span className="text-xl font-bold font-mono text-blue-400">
                  {totalParseCssomMs} ms
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Byte to node pipeline
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Layout Reflow Duration
                </span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {layoutTimeMs} ms
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Viewport spatial calculation
                </span>
              </div>
            </div>

            {/* Frame Budget Status */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                isJanky
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {isJanky ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider">
                  {isJanky ? 'Layout Jank Detected (>16.6ms)' : 'Smooth Frame Rate (60 FPS)'}
                </h5>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                  {isJanky
                    ? `Layout reflow takes ${layoutTimeMs}ms, exceeding the 16.6ms budget. Dynamic animations or scrolling will experience visible stuttering.`
                    : `Layout geometry executes in ${layoutTimeMs}ms within the 16.6ms frame budget, guaranteeing fluid animations.`}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-850 text-right">
            <span className="text-[11px] text-slate-400 italic">
              * Calculations modeled after Chromium rendering engine pipeline benchmarks.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
