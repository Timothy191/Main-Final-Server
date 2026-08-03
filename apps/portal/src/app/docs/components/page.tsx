import { PrimitivesShowcase } from '@/components/PrimitivesShowcase'

export const metadata = {
  title: 'UI Primitives Showcase | Arch Systems Portal',
  description: 'Live showcase of @repo/ui primitives including Avatar, Kbd, and Spinner.',
}

export default function ComponentsShowcasePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950">
      <PrimitivesShowcase />
    </main>
  )
}
