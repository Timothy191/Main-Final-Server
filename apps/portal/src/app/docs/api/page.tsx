'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(
  () => import('swagger-ui-react').then((mod) => ({ default: mod.SwaggerUI })),
  { ssr: false }
)

// AGENT-TRACE: API documentation page using Swagger UI
// This page provides an interactive interface for exploring the API
// Protected by Supabase auth - only accessible to admin and engineering roles
// Loads OpenAPI spec from /api/doc endpoint

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-arch-surface-primary text-arch-text-primary">
      <div className="border-b border-arch-border-subtle glass-card rounded-none backdrop-blur-xl p-4">
        <h1 className="text-2xl font-semibold text-arch-text-primary">API Documentation</h1>
        <p className="text-sm text-arch-text-muted mt-1">
          Interactive API reference for Arch-Systems Portal
        </p>
      </div>
      <SwaggerUI
        url="/api/doc"
        docExpansion="list"
        defaultModelsExpandDepth={2}
        defaultModelExpandDepth={2}
        tryItOutEnabled={true}
        persistAuthorization={true}
        displayRequestDuration={true}
        displayOperationId={false}
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
        syntaxHighlight={{
          theme: 'nord',
        }}
      />
    </div>
  )
}
