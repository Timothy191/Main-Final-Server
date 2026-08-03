'use client'

import { useFormStatus } from 'react-dom'
import { registerVisitor } from '../actions'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Users, Plus, Loader2 } from 'lucide-react'
import { GlassCard } from '@repo/ui/GlassCard'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending, method } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-accent-cyan text-bg-secondary hover:bg-accent-cyan/90 shadow-diffusion-cyan transition-all"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {method === 'POST' ? 'Registering...' : 'Submitting...'}
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Register & Issue Badge
        </>
      )}
    </Button>
  )
}

export function VisitorForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function clientAction(formData: FormData) {
    setError(null)
    try {
      const result = await registerVisitor(formData)
      if (result.success) {
        toast.success('Visitor registered successfully', {
          description: `${formData.get('first_name')} ${formData.get('surname')} has been checked in.`,
        })
        formRef.current?.reset()
      } else {
        setError('Failed to register visitor. Please try again.')
        toast.error('Registration failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      toast.error('An error occurred', {
        description: message,
      })
    }
  }

  return (
    <GlassCard>
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-arch-accent-charcoal/10 rounded-lg">
          <Users className="w-5 h-5 text-arch-accent-charcoal" />
        </div>
        <h3 className="font-semibold text-arch-text-primary">New Registration</h3>
      </div>

      <form ref={formRef} action={clientAction} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="first_name"
            className="text-xs font-medium text-arch-text-muted uppercase tracking-wider block"
          >
            First Name
          </label>
          <Input
            id="first_name"
            name="first_name"
            placeholder="John"
            required
            className="bg-arch-surface-tertiary border-arch-border-default"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="surname"
            className="text-xs font-medium text-arch-text-muted uppercase tracking-wider block"
          >
            Surname
          </label>
          <Input
            id="surname"
            name="surname"
            placeholder="Doe"
            required
            className="bg-arch-surface-tertiary border-arch-border-default"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="company"
            className="text-xs font-medium text-arch-text-muted uppercase tracking-wider block"
          >
            Company / Agency
          </label>
          <Input
            id="company"
            name="company"
            placeholder="Acme Corp"
            className="bg-arch-surface-tertiary border-arch-border-default"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="reason"
            className="text-xs font-medium text-arch-text-muted uppercase tracking-wider block"
          >
            Reason for Visit
          </label>
          <Input
            id="reason"
            name="reason"
            placeholder="Maintenance, Audit, etc."
            className="bg-arch-surface-tertiary border-arch-border-default"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-500 mt-2">{error}</p>}

        <div className="pt-4">
          <SubmitButton />
        </div>
      </form>
    </GlassCard>
  )
}
