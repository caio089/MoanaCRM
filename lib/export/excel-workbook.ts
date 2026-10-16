'use client'

export type ExcelCellValue = string | number | boolean | Date | null | undefined

export type ExcelColumnFormat = 'text' | 'currency' | 'date' | 'datetime' | 'boolean'

export interface ExcelColumn<Row> {
  header: string
  width?: number
  format?: ExcelColumnFormat
  value: (row: Row) => ExcelCellValue
}

export interface ExcelSheet<Row = Record<string, unknown>> {
  name: string
  columns: ExcelColumn<Row>[]
  rows: Row[]
}

const NUMBER_FORMATS: Partial<Record<ExcelColumnFormat, string>> = {
  currency: '"R$" #,##0.00',
  date: 'dd/mm/yyyy',
  datetime: 'dd/mm/yyyy hh:mm',
}

const HEADER_FILL = 'FF1F2937'
const HEADER_FONT = 'FFF5F1E8'

function normalizeCell(value: ExcelCellValue, format?: ExcelColumnFormat): ExcelCellValue {
  if (value === null || value === undefined || value === '') return null
  if (format === 'boolean') return value ? 'Sim' : 'Não'
  if (format === 'date' || format === 'datetime') {
    const date = value instanceof Date ? value : new Date(String(value))
    return Number.isNaN(date.getTime()) ? String(value) : date
  }
  if (format === 'currency') {
    const amount = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(amount) ? amount : null
  }
  // CPF/telefone precisam continuar texto para não perder zeros à esquerda
  if (format === 'text') return String(value)
  return value
}

/** Gera o .xlsx no navegador e dispara o download. */
export async function downloadWorkbook(fileName: string, sheets: ExcelSheet<any>[]): Promise<void> {
  // Import dinâmico: a lib só é baixada quando o usuário exporta
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Construtora Moana CRM'
  workbook.created = new Date()

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      width: column.width ?? 18,
      style: NUMBER_FORMATS[column.format ?? 'text']
        ? { numFmt: NUMBER_FORMATS[column.format ?? 'text'] }
        : undefined,
    }))

    for (const row of sheet.rows) {
      worksheet.addRow(sheet.columns.map((column) => normalizeCell(column.value(row), column.format)))
    }

    const header = worksheet.getRow(1)
    header.font = { bold: true, color: { argb: HEADER_FONT } }
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    header.alignment = { vertical: 'middle' }

    if (sheet.columns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheet.columns.length },
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
