import Image from 'next/image'
import Link from 'next/link'
import { EVE_BRAND } from '@/config/vercel-brands'

/**
 * Login card notice — eve agent framework backend optimization status.
 */
export function LoginEveNotice() {
  return (
    <aside
      className="login-notice login-notice--eve p-4 flex items-center gap-3 select-none"
      aria-label="eve backend optimization status"
    >
      <Link
        href={EVE_BRAND.href ?? 'https://eve.dev'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit eve - The agent framework"
        className="login-eve-mark shrink-0 rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
      >
        <Image
          src={EVE_BRAND.src}
          alt=""
          width={48}
          height={18}
          className="h-[18px] w-auto object-contain"
          style={{ width: 'auto', height: 'auto' }}
          unoptimized
        />
      </Link>

      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="login-text-emphasis text-[12px] font-semibold tracking-wide lowercase">
            {EVE_BRAND.name}
          </span>
          <span className="login-eve-status text-[11px] font-medium tracking-wide">
            Integrated · Active
          </span>
        </div>
        <p className="login-muted-text text-[12px] font-medium leading-relaxed tracking-wide">
          Backend services are continuously optimized in the background. Your sign-in and session
          are unaffected — no action required.
        </p>
      </div>
    </aside>
  )
}
