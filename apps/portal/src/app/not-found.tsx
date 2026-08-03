import Link from 'next/link'
import Image from 'next/image'
import { SecondaryButton } from '@repo/ui/SecondaryButton'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-arch-surface-primary flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/error-pages/404-error.png"
            alt="404 Not Found"
            width={120}
            height={120}
            priority
            className="opacity-80 hover:opacity-100 transition-opacity duration-200"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-medium text-arch-text-primary">404</h1>
          <p className="text-arch-text-muted text-sm">
            The page you are looking for does not exist.
          </p>
        </div>
        <div className="space-y-4">
          <SecondaryButton asChild>
            <Link href="/">Return to Home</Link>
          </SecondaryButton>
          <SecondaryButton asChild>
            <Link href="/hub">Go to Hub</Link>
          </SecondaryButton>
          <SecondaryButton asChild>
            <Link href="/docs/api">API Documentation</Link>
          </SecondaryButton>
          <SecondaryButton asChild>
            <Link href="/privacy">Privacy Policy</Link>
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}
