import { dualCaseRow } from '@/lib/query/columns'

/** Aplica dualCaseRow em uma row ou lista de rows (compat camelCase/snake_case). */
export function dualCaseRows(data: unknown): unknown {
  if (data == null) return data

  if (Array.isArray(data)) {
    return data.map((row) => {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        return dualCaseRow(row as Record<string, unknown>)
      }
      return row
    })
  }

  if (typeof data === 'object') {
    return dualCaseRow(data as Record<string, unknown>)
  }

  return data
}
