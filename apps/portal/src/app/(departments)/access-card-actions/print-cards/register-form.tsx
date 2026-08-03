'use client'

import { useFormStatus } from 'react-dom'
import { registerPrinter } from '../actions'
import { Button } from '@repo/ui/components/ui/button'
import { toast } from 'sonner'

interface RegisterFormProps {
  cupsName: string
  name: string
  model: string
  connectionType: string
  vendorId?: string
  productId?: string
  devicePath?: string
}

function SubmitButton() {
  const { pending, method } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      variant="outline"
      disabled={pending}
      className="text-xs font-medium"
    >
      {pending ? (method === 'POST' ? 'Registering…' : 'Processing…') : 'Register'}
    </Button>
  )
}

export function RegisterPrinterForm(props: RegisterFormProps) {
  async function handleSubmit(formData: FormData) {
    const cupsName = formData.get('cupsName') as string
    const name = formData.get('name') as string
    const model = formData.get('model') as string
    const connectionType = formData.get('connectionType') as string
    const vendorId = formData.get('vendorId') as string
    const productId = formData.get('productId') as string
    const devicePath = formData.get('devicePath') as string

    try {
      await registerPrinter({
        cupsName,
        name,
        model,
        connectionType,
        vendorId: vendorId || undefined,
        productId: productId || undefined,
        devicePath: devicePath || undefined,
      })
      toast.success('Printer registered successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register printer')
    }
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="cupsName" value={props.cupsName} />
      <input type="hidden" name="name" value={props.name} />
      <input type="hidden" name="model" value={props.model} />
      <input type="hidden" name="connectionType" value={props.connectionType} />
      <input type="hidden" name="vendorId" value={props.vendorId ?? ''} />
      <input type="hidden" name="productId" value={props.productId ?? ''} />
      <input type="hidden" name="devicePath" value={props.devicePath ?? ''} />
      <SubmitButton />
    </form>
  )
}
