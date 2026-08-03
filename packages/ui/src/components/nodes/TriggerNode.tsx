'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'

// =============================================================================
// Trigger Node Data Type
// =============================================================================

export interface TriggerNodeData extends Record<string, unknown> {
  label: string
}

// =============================================================================
// Trigger Node Component
// =============================================================================

export const TriggerNode = memo(function TriggerNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as TriggerNodeData

  return (
    <div
      className={`
        relative min-w-[140px] rounded-xl border border-[#007aff]/30
        bg-gradient-to-br from-[#007aff]/10 to-[#007aff]/5
        backdrop-blur-xl shadow-card
        transition-all duration-200
        ${selected ? 'ring-2 ring-[#007aff] ring-offset-2' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#007aff]">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
        <span className="text-xs font-medium text-[#1d1d1f] truncate">{data.label || 'Start'}</span>
      </div>

      {/* Output Handle Only (trigger is start node) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#007aff] !border-2 !border-white !-right-1.5"
      />
    </div>
  )
})

export default TriggerNode
