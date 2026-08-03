import React from 'react'
import type { Metadata } from 'next'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Arch OS',
  description: 'Privacy policy and data compliance for the Arch Portal.',
}

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-arch-surface-tertiary rounded-xl">
          <Shield className="w-8 h-8 text-arch-text-primary" />
        </div>
        <h1 className="text-3xl font-semibold text-arch-text-primary">Privacy Policy</h1>
      </div>

      <div className="prose prose-neutral max-w-none text-arch-text-muted space-y-6">
        <p className="text-lg">Last updated: July 2026</p>

        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.08] p-8 rounded-2xl shadow-card">
          <h2 className="text-xl font-medium text-arch-text-primary mb-4">
            1. Data Collection and Usage
          </h2>
          <p className="mb-4">
            The Arch Portal collects operational telemetry, user interaction data, and system
            performance metrics necessary to ensure the continuous and safe operation of mining
            facilities.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Authentication Data:</strong> Employee IDs, roles, and department affiliations
              to enforce access control (via Supabase RLS).
            </li>
            <li>
              <strong>Operational Telemetry:</strong> Machine status, fuel logs, and safety
              incidents entered by users.
            </li>
            <li>
              <strong>System Metrics:</strong> Client-side performance metrics to optimize dashboard
              responsiveness.
            </li>
          </ul>
        </section>

        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.08] p-8 rounded-2xl shadow-card">
          <h2 className="text-xl font-medium text-arch-text-primary mb-4">
            2. Cookies and Tracking
          </h2>
          <p>
            We use strictly necessary cookies to maintain your authenticated session. Optional
            cookies may be used to analyze system performance and improve the user interface. You
            can manage your preferences through the cookie consent banner.
          </p>
        </section>

        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.08] p-8 rounded-2xl shadow-card">
          <h2 className="text-xl font-medium text-arch-text-primary mb-4">
            3. Data Security and Isolation
          </h2>
          <p>
            Data is strictly isolated by department. Personnel can only view and modify data
            relevant to their assigned department and role level. All data is transmitted over
            encrypted channels (HTTPS/WSS) and stored securely in our enterprise database.
          </p>
        </section>

        <section className="bg-white/70 backdrop-blur-xl border border-black/[0.08] p-8 rounded-2xl shadow-card">
          <h2 className="text-xl font-medium text-arch-text-primary mb-4">
            4. Compliance and Contact
          </h2>
          <p>
            This portal complies with internal IT security standards and applicable data protection
            regulations. For privacy-related inquiries, please contact the IT Security Department or
            your Shift Supervisor.
          </p>
        </section>
      </div>
    </div>
  )
}
