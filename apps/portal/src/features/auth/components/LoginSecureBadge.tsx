'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'

interface NodeStatus {
  nodeLabel: string
  cryptoLabel: string
}

function resolveNodeStatus(hostname: string, isSecure: boolean): NodeStatus {
  const isLocal =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')

  return {
    nodeLabel: isLocal ? 'Local Host Active' : `${hostname} Active`,
    cryptoLabel: isSecure ? 'Cryptographic Validation: OK' : 'Cryptographic Validation: Required',
  }
}

export function LoginSecureBadge() {
  const [status, setStatus] = useState<NodeStatus | null>(null)

  useEffect(() => {
    setStatus(resolveNodeStatus(window.location.hostname, window.isSecureContext))
  }, [])

  const ariaLabel = status
    ? `Secure connection. ${status.nodeLabel}. ${status.cryptoLabel}.`
    : 'Secure connection.'

  return (
    <div
      className="login-secure-badge"
      role="status"
      tabIndex={0}
      aria-label={ariaLabel}
      title={status ? `${status.nodeLabel} · ${status.cryptoLabel}` : 'Secure connection'}
    >
      <Lock className="login-secure-badge__icon" strokeWidth={1.5} aria-hidden="true" />
      <span className="login-secure-badge__label">Secure</span>
      {status ? (
        <span className="login-secure-badge__detail" aria-hidden="true">
          <span className="login-secure-badge__separator">·</span>
          {status.nodeLabel}
          <span className="login-secure-badge__separator">·</span>
          {status.cryptoLabel}
        </span>
      ) : null}
    </div>
  )
}
