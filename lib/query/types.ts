export type FilterOp =
  | { type: 'eq'; col: string; value: unknown }
  | { type: 'neq'; col: string; value: unknown }
  | { type: 'gte'; col: string; value: unknown }
  | { type: 'lte'; col: string; value: unknown }
  | { type: 'in'; col: string; value: unknown[] }
  | { type: 'not'; col: string; operator: string; value: unknown }
  | { type: 'or'; expr: string }

export type QuerySpec = {
  table: string
  op: 'select' | 'insert' | 'update' | 'delete'
  columns: string
  filters: FilterOp[]
  orderBy?: { col: string; ascending: boolean }
  range?: { from: number; to: number }
  limit?: number
  count?: boolean
  head?: boolean
  single?: boolean
  payload?: unknown
}

export type QueryResult = {
  data: any
  error: { message: string } | null
  count: number | null
}
