'use client'

import * as React from 'react'
import { Avatar, Kbd, Spinner, Card, CardHeader, CardTitle, CardContent, Badge } from '@repo/ui'

export function PrimitivesShowcase() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            UI Primitives Showcase
          </h1>
          <Badge variant="info">@repo/ui</Badge>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Live showcase of primitives ported from shadcn-ui with Arch Systems design tokens.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Showcase */}
        <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Avatar Primitive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-around">
              <Avatar size="sm" fallback="JD" />
              <Avatar size="md" fallback="TS" />
              <Avatar size="lg" fallback="AS" />
              <Avatar size="xl" fallback="AI" />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <Avatar fallback="AP" size="md" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Arch Operator</p>
                <p className="text-xs text-slate-500">System Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kbd Showcase */}
        <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Kbd Primitive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-2 dark:border-slate-800">
                <span>Command Palette</span>
                <div className="flex gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-2 dark:border-slate-800">
                <span>Print Document</span>
                <div className="flex gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>P</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-2 dark:border-slate-800">
                <span>Quick Search</span>
                <Kbd>/</Kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spinner Showcase */}
        <Card className="border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Spinner Primitive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-around py-2">
              <div className="text-center">
                <Spinner size="sm" className="mx-auto" />
                <span className="text-xs text-slate-500">sm</span>
              </div>
              <div className="text-center">
                <Spinner size="md" className="mx-auto text-blue-600" />
                <span className="text-xs text-slate-500">md</span>
              </div>
              <div className="text-center">
                <Spinner size="lg" className="mx-auto text-emerald-500" />
                <span className="text-xs text-slate-500">lg</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 p-3 text-white">
              <Spinner size="sm" className="text-white" />
              <span className="text-sm font-medium">Processing sync...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
