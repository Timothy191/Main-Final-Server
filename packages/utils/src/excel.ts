import type { Fill, Font, Borders } from 'exceljs'

type Primitive = string | number | boolean | Date | null | undefined

export interface ExcelColumnConfig {
  key: string
  header: string
  width?: number
  type?: 'string' | 'number' | 'date' | 'currency'
}

export interface ExcelSheetConfig {
  name: string
  columns: ExcelColumnConfig[]
  data: Record<string, Primitive>[]
}

async function triggerDownload(workbook: import('exceljs').Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exports JSON data to a single-sheet Excel file
 */
export async function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet(sheetName)

  if (data.length > 0) {
    const headers = Object.keys(data[0])
    ws.addRow(headers)
    data.forEach((row) => {
      ws.addRow(headers.map((h) => row[h]))
    })
  }

  await triggerDownload(workbook, fileName)
}

/**
 * Exports multiple sheets to an Excel file
 */
export async function exportMultiSheetExcel(sheets: ExcelSheetConfig[], fileName: string) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name)
    if (sheet.columns.some((c) => c.width)) {
      ws.columns = sheet.columns.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width ?? 12,
      }))
    } else {
      ws.addRow(sheet.columns.map((c) => c.header))
    }

    for (const row of sheet.data) {
      if (ws.columns) {
        ws.addRow(
          sheet.columns.reduce(
            (acc, col) => {
              let val = row[col.key]
              if (val instanceof Date) {
                val = col.type === 'date' ? val.toISOString() : val
              }
              acc[col.key] = val ?? ''
              return acc
            },
            {} as Record<string, Primitive>
          )
        )
      } else {
        ws.addRow(
          sheet.columns.map((col) => {
            let val = row[col.key]
            if (val instanceof Date) {
              return col.type === 'date' ? val.toISOString() : val
            }
            return val ?? ''
          })
        )
      }
    }
  }
  await triggerDownload(workbook, fileName)
}

/**
 * Styled Excel export with formulas, cell formatting, and multiple sheets.
 */
export async function exportStyledExcel(
  sheets: ExcelSheetConfig[],
  fileName: string,
  options?: {
    headerColor?: string
    headerFontColor?: string
    currencyFormat?: string
    dateFormat?: string
  }
) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()

  const headerFill: Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: options?.headerColor?.replace('#', '') ?? '1F2937' },
  }
  const headerFont: Partial<Font> = {
    bold: true,
    color: { argb: options?.headerFontColor?.replace('#', '') ?? 'FFFFFF' },
  }
  const borderStyle: Partial<Borders> = {
    top: { style: 'thin', color: { argb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
    left: { style: 'thin', color: { argb: 'D1D5DB' } },
    right: { style: 'thin', color: { argb: 'D1D5DB' } },
  }

  const currencyFmt = options?.currencyFormat ?? '"R"#,##0.00'
  const dateFmt = options?.dateFormat ?? 'yyyy-mm-dd'

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name)
    ws.columns = sheet.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 15,
    }))

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = borderStyle
    })

    // Add data rows with type-aware formatting
    for (const row of sheet.data) {
      const dataRow = ws.addRow(
        sheet.columns.reduce(
          (acc, col) => {
            acc[col.key] = row[col.key]
            return acc
          },
          {} as Record<string, Primitive>
        )
      )

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colConfig = sheet.columns[colNumber - 1]
        if (!colConfig) return
        cell.border = borderStyle

        if (colConfig.type === 'currency') {
          cell.numFmt = currencyFmt
        } else if (colConfig.type === 'date') {
          cell.numFmt = dateFmt
        }
      })
    }

    // Auto-filter on header row
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: ws.rowCount, column: sheet.columns.length },
    }
  }

  await triggerDownload(workbook, fileName)
}

/**
 * Parses an Excel file and returns JSON data
 */
export async function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const ExcelJS = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        const buffer = e.target?.result as ArrayBuffer
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) throw new Error('No worksheet found')

        const jsonData: any[] = []
        let headers: string[] = []

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            headers = (row.values as string[]).slice(1) // 1-indexed
          } else {
            const rowData: Record<string, any> = {}
            const values = (
              row.values as (string | number | boolean | Date | null | undefined)[]
            ).slice(1)
            headers.forEach((h, i) => {
              rowData[h] = values[i]
            })
            jsonData.push(rowData)
          }
        })

        resolve(jsonData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}
