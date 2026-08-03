'use client'

import React, { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, Save, Loader2 } from 'lucide-react'

import { PluginNode } from './nodes/PluginNode'
import { TriggerNode } from './nodes/TriggerNode'
import { FlowEdge } from './edges/FlowEdge'

// =============================================================================
// Node & Edge Types
// =============================================================================

const nodeTypes = {
  plugin: PluginNode,
  trigger: TriggerNode,
}

const edgeTypes = {
  flow: FlowEdge,
}

// =============================================================================
// Workflow Builder Props
// =============================================================================

export interface WorkflowBuilderProps {
  /** Initial nodes to render */
  initialNodes?: Node[]
  /** Initial edges to render */
  initialEdges?: Edge[]
  /** Callback when workflow is saved */
  // eslint-disable-next-line no-unused-vars
  onSave?: (currentNodes: Node[], currentEdges: Edge[]) => void
  /** Callback when workflow is executed */
  // eslint-disable-next-line no-unused-vars
  onExecute?: (currentNodes: Node[], currentEdges: Edge[]) => Promise<void>
  /** Read-only mode */
  readOnly?: boolean
  /** Custom styles */
  className?: string
}

// =============================================================================
// Default Initial Nodes
// =============================================================================

const defaultNodes: Node[] = [
  {
    id: 'trigger',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: { label: 'Start Workflow' },
  },
  {
    id: 'plugin-1',
    type: 'plugin',
    position: { x: 400, y: 200 },
    data: {
      label: 'Plugin Step',
      pluginId: 'predictive-maintenance',
      config: {},
    },
  },
]

const defaultEdges: Edge[] = [
  {
    id: 'e-trigger-plugin',
    source: 'trigger',
    target: 'plugin-1',
    type: 'flow',
  },
]

// =============================================================================
// Workflow Builder Component
// =============================================================================

export function WorkflowBuilder({
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  onSave,
  onExecute,
  readOnly = false,
  className = '',
}: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isExecuting, setIsExecuting] = useState(false)

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: 'flow',
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  // Add new plugin node
  const addPluginNode = useCallback(() => {
    const newNode: Node = {
      id: `plugin-${Date.now()}`,
      type: 'plugin',
      position: { x: 400 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: {
        label: 'New Plugin Step',
        pluginId: '',
        config: {},
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  // Save workflow
  const handleSave = useCallback(() => {
    onSave?.(nodes, edges)
  }, [nodes, edges, onSave])

  // Execute workflow
  const handleExecute = useCallback(async () => {
    if (!onExecute) return
    setIsExecuting(true)
    try {
      await onExecute(nodes, edges)
    } finally {
      setIsExecuting(false)
    }
  }, [nodes, edges, onExecute])

  return (
    <div
      className={`w-full h-[600px] rounded-lg border border-black/[0.08] border-t-white/90 bg-white/70 backdrop-blur-xl overflow-hidden ${className}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#a1a1a6" gap={16} size={1} />
        <Controls className="!bg-white/80 !backdrop-blur-xl !border-black/[0.08]" />
        <MiniMap
          className="!bg-white/80 !backdrop-blur-xl !border-black/[0.08]"
          maskColor="rgba(0,0,0,0.1)"
          nodeColor={(node) => {
            if (node.type === 'trigger') return '#007aff'
            if (node.type === 'plugin') return '#34c759'
            return '#a1a1a6'
          }}
        />

        {/* Toolbar Panel */}
        <Panel position="top-left" className="m-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/80 backdrop-blur-xl border border-black/[0.08] shadow-card">
            <button
              onClick={addPluginNode}
              disabled={readOnly}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-black/[0.08] text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Add Plugin
            </button>

            <div className="w-px h-4 bg-black/[0.08]" />

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-black/[0.08] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>

            {onExecute && (
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#007aff] text-white hover:bg-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {isExecuting ? 'Running...' : 'Execute'}
              </button>
            )}
          </div>
        </Panel>

        {/* Info Panel */}
        <Panel position="bottom-left" className="m-4">
          <div className="px-3 py-2 rounded-lg bg-white/80 backdrop-blur-xl border border-black/[0.08] text-[10px] text-[#6e6e73]">
            <p>Drag to connect nodes • Double-click to edit</p>
            <p className="mt-0.5">
              {nodes.length} nodes • {edges.length} connections
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default WorkflowBuilder
