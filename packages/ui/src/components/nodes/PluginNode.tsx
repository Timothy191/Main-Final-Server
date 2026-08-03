'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Settings, Puzzle } from 'lucide-react'

// =============================================================================
// Plugin Node Data Type
// =============================================================================

export interface PluginNodeData extends Record<string, unknown> {
  label: string
  pluginId: string
  config: Record<string, unknown>
}

// =============================================================================
// Plugin Node Component
// =============================================================================

export const PluginNode = memo(function PluginNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as PluginNodeData
  return (
    <div
      className={`
        relative min-w-[180px] rounded-xl border border-[#34c759]/30
        bg-gradient-to-br from-[#f5f5f7] to-white
        backdrop-blur-xl shadow-card
        transition-all duration-200
        ${selected ? 'ring-2 ring-[#007aff] ring-offset-2' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#e8e8ed]">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#34c759]/10">
          <Puzzle className="w-3.5 h-3.5 text-[#34c759]" />
        </div>
        <span className="text-xs font-medium text-[#1d1d1f] truncate">
          {data.label || 'Plugin Step'}
        </span>
        <button
          className="ml-auto p-1 rounded hover:bg-black/[0.04] transition-colors"
          aria-label="Configure plugin"
        >
          <Settings className="w-3 h-3 text-[#6e6e73]" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6e6e73] uppercase tracking-wide">Plugin ID</span>
          <span className="text-[10px] font-mono text-[#3a3a3c] truncate max-w-[100px]">
            {data.pluginId || 'not set'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6e6e73] uppercase tracking-wide">Config</span>
          <span className="text-[10px] text-[#3a3a3c]">
            {Object.keys(data.config || {}).length} params
          </span>
        </div>
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[#007aff] !border-2 !border-white !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#007aff] !border-2 !border-white !-right-1.5"
      />
    </div>
  )
})

export default PluginNode
