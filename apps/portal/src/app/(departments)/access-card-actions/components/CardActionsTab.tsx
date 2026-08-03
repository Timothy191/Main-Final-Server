'use client'

import Image from 'next/image'
import { useState } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Printer, AlertCircle, Info, User } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { submitPrintJob } from '../printing'
import { EmployeeSearch } from './EmployeeSearch'
import { ActionConfirmDialog } from '@repo/ui/components/ui/action-confirm-dialog'
import { QRCodeSection } from '../card-actions/qr-section'
import type { searchEmployees } from '../actions'

type Employee = Awaited<ReturnType<typeof searchEmployees>>['employees'][0]

export function CardActionsTab() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [magStripeData, setMagStripeData] = useState('')
  const [holokoteDesign, setHolokoteDesign] = useState('standard')
  const [isPrinting, setIsPrinting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [printerStatus, setPrinterStatus] = useState<'idle' | 'printing' | 'error'>('idle')
  const [cleaningReminder] = useState(true)

  const initiatePrint = () => {
    if (!employee) return
    setShowConfirm(true)
  }

  const handlePrint = async () => {
    if (!employee) return
    setShowConfirm(false)
    setIsPrinting(true)
    setPrinterStatus('printing')

    const result = await submitPrintJob({
      employeeId: employee.id,
      firstName: employee.first_name || '',
      lastName: employee.last_name || '',
      nationalId: employee.national_id || '',
      jobTitle: employee.job_title || '',
      qrCodeData: employee.qr_code_data || '',
      magStripeData,
      holokoteDesign,
    })

    setIsPrinting(false)
    if (result.success) {
      setPrinterStatus('idle')
    } else {
      setPrinterStatus('error')
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column: Employee Data (Read-Only) */}
      <div className="xl:col-span-1 space-y-6">
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-arch-text-muted mb-2">Search Employee</h3>
            <EmployeeSearch onSelect={setEmployee} />
          </div>

          <h3 className="text-lg font-medium text-arch-text-primary mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-arch-text-muted" />
            Employee Profile
          </h3>

          {employee ? (
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-arch-surface-tertiary rounded-xl border border-arch-border-default flex items-center justify-center overflow-hidden relative">
                  {employee.photo_url ? (
                    <Image src={employee.photo_url} alt="Photo" fill className="object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-arch-text-muted" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div className="text-arch-text-muted">Name</div>
                <div className="font-medium text-arch-text-primary">
                  {employee.first_name} {employee.last_name}
                </div>

                <div className="text-arch-text-muted">ID</div>
                <div className="font-medium text-arch-text-primary">{employee.national_id}</div>

                <div className="text-arch-text-muted">Job Title</div>
                <div className="font-medium text-arch-text-primary">{employee.job_title}</div>

                <div className="text-arch-text-muted">Areas</div>
                <div className="font-medium text-arch-text-primary">
                  {(employee.areas || []).join(', ')}
                </div>

                <div className="text-arch-text-muted">Medical Expiry</div>
                <div className="font-medium text-arch-text-primary">
                  {employee.medical_expiry_date || 'N/A'}
                </div>

                <div className="text-arch-text-muted">Induction Expiry</div>
                <div className="font-medium text-arch-text-primary">
                  {employee.induction_expiry_date || 'N/A'}
                </div>

                <div className="text-arch-text-muted">QR Code Data</div>
                <div className="font-mono text-xs truncate" title={employee.qr_code_data || ''}>
                  {employee.qr_code_data || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-arch-text-muted">
              <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select an employee to view details and print a card.</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Middle Column: Print Actions */}
      <div className="xl:col-span-1 space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-medium text-arch-text-primary mb-4">
            Card Encoding & Design
          </h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="magstripe" className="text-sm font-medium text-arch-text-primary">
                Magnetic Stripe Data (Optional)
              </label>
              <Input
                id="magstripe"
                value={magStripeData}
                onChange={(e) => setMagStripeData(e.target.value)}
                placeholder="Track 1/2 Data"
                className="font-mono bg-arch-surface-primary border-arch-border-default"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-arch-text-primary">HoloKote Design</label>
              <select
                value={holokoteDesign}
                onChange={(e) => setHolokoteDesign(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-arch-border-default bg-arch-surface-primary px-3 py-2 text-sm text-arch-text-primary focus:outline-none focus:ring-2 focus:ring-arch-accent-charcoal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="standard">Standard Security Pattern</option>
                <option value="custom-logo">Company Logo</option>
                <option value="high-security">High Security Grid</option>
              </select>
            </div>

            <div className="pt-4 border-t border-arch-border-default">
              <label className="text-sm font-medium text-arch-text-primary mb-2 block">
                Printer Status
              </label>
              <div className="bg-arch-surface-secondary rounded-lg p-3 flex items-center justify-between border border-arch-border-default">
                <div className="flex items-center gap-2">
                  <Printer
                    className={cn(
                      'w-5 h-5',
                      printerStatus === 'printing'
                        ? 'text-blue-500 animate-pulse'
                        : printerStatus === 'error'
                          ? 'text-red-500'
                          : 'text-green-500'
                    )}
                  />
                  <span className="text-sm font-medium">
                    {printerStatus === 'printing'
                      ? 'Printing...'
                      : printerStatus === 'error'
                        ? 'Error: Ribbon Empty'
                        : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {cleaningReminder && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Cleaning Recommended</p>
                  <p className="opacity-90">150 cards printed since last cleaning cycle.</p>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4"
              onClick={initiatePrint}
              disabled={isPrinting || printerStatus === 'error' || !employee}
            >
              {isPrinting ? 'Initiating Print...' : 'Initiate Card Print'}
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Right Column: Preview */}
      <div className="xl:col-span-1 space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-medium text-arch-text-primary mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-arch-text-muted" />
            Print Preview
          </h3>

          <div className="aspect-[2.125/3.375] w-64 mx-auto bg-white rounded-xl shadow-[var(--shadow-window)] border border-black/10 relative overflow-hidden flex flex-col">
            {/* Top color bar representing department */}
            <div className="h-6 w-full bg-blue-600" />

            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-start">
                <div className="w-20 h-24 bg-gray-200 rounded border border-gray-300 flex items-center justify-center overflow-hidden relative">
                  {employee?.photo_url ? (
                    <Image src={employee.photo_url} alt="Photo" fill className="object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 text-sm leading-tight">
                    {employee?.first_name || 'FIRST'}
                  </div>
                  <div className="font-bold text-gray-800 text-sm leading-tight uppercase">
                    {employee?.last_name || 'LAST'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex-1">
                <div className="text-[10px] text-gray-500 font-semibold">JOB TITLE</div>
                <div className="text-xs font-bold text-gray-800 leading-tight">
                  {employee?.job_title || 'JOB TITLE'}
                </div>

                <div className="text-[10px] text-gray-500 font-semibold mt-2">ID NUMBER</div>
                <div className="text-xs font-bold text-gray-800 leading-tight">
                  {employee?.national_id || 'ID NUMBER'}
                </div>
              </div>

              <div className="mt-auto border-t border-gray-200 pt-2 flex justify-between items-end">
                <div>
                  <div className="text-[8px] text-gray-500">AREAS</div>
                  <div className="text-[10px] font-bold text-gray-800 leading-tight max-w-[80px] truncate">
                    {(employee?.areas || []).join(', ') || 'AREAS'}
                  </div>
                </div>
                <div className="w-16 h-16 bg-white flex items-center justify-center -mb-1 -mr-1">
                  {employee?.qr_code_data ? (
                    <QRCodeSection data={employee.qr_code_data} size={64} />
                  ) : (
                    <div className="w-full h-full border border-dashed border-gray-300" />
                  )}
                </div>
              </div>
            </div>

            {/* HoloKote overlay mock */}
            {holokoteDesign !== 'standard' && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')",
                }}
              />
            )}
          </div>

          <p className="text-xs text-center text-arch-text-muted mt-6">
            Preview is an approximation. Colors may vary slightly when printed.
          </p>
        </GlassCard>
      </div>

      <ActionConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handlePrint}
        title="Confirm Card Print"
        description={`Are you sure you want to print an access card for ${employee?.first_name} ${employee?.last_name}? This action will consume one blank card and one print ribbon cycle.`}
        confirmText="Print Card"
        variant="default"
      />
    </div>
  )
}
