import { createClient } from '@/lib/supabase/client'
import { dualCaseRows } from '@/lib/supabase/dual'
import { toSnakeCase } from '@/lib/query/columns'
import { mapAuthUser } from '@/lib/auth/map-user'
import type { QueryResult, QuerySpec } from '@/lib/query/types'
import type { AuthUser } from '@/lib/auth/types'

type SessionPayload = {
  data: {
    session: {
      user: AuthUser
    } | null
  }
}

type AuthListener = (event: string, session: SessionPayload['data']['session']) => void

const TABLE_ALIASES: Record<string, string> = {
  correspondentes: 'correspondentes_bancarios',
  admin_users: 'users',
}

function resolveTable(table: string): string {
  return TABLE_ALIASES[table] ?? table
}

function snakeCol(col: string): string {
  return toSnakeCase(col)
}

function snakeColumns(columns: string): string {
  if (!columns || columns === '*') return '*'
  return columns
    .split(',')
    .map((part) => snakeCol(part.trim()))
    .join(', ')
}

function snakePayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map((item) => snakePayload(item))
  }
  if (!payload || typeof payload !== 'object') {
    return payload
  }

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const nextKey = snakeCol(key)
    if (value instanceof Date) {
      out[nextKey] = value.toISOString()
    } else {
      out[nextKey] = value
    }
  }
  return out
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

class QueryBuilder implements PromiseLike<QueryResult> {
  private spec: QuerySpec

  constructor(table: string) {
    this.spec = {
      table,
      op: 'select',
      columns: '*',
      filters: [],
    }
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.spec.columns = columns
    this.spec.count = options?.count === 'exact'
    this.spec.head = options?.head === true
    return this
  }

  eq(col: string, value: unknown) {
    this.spec.filters.push({ type: 'eq', col, value })
    return this
  }

  neq(col: string, value: unknown) {
    this.spec.filters.push({ type: 'neq', col, value })
    return this
  }

  gte(col: string, value: unknown) {
    this.spec.filters.push({ type: 'gte', col, value })
    return this
  }

  lte(col: string, value: unknown) {
    this.spec.filters.push({ type: 'lte', col, value })
    return this
  }

  in(col: string, value: unknown[]) {
    this.spec.filters.push({ type: 'in', col, value })
    return this
  }

  not(col: string, operator: string, value: unknown) {
    this.spec.filters.push({ type: 'not', col, operator, value })
    return this
  }

  or(expr: string) {
    this.spec.filters.push({ type: 'or', expr })
    return this
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.spec.orderBy = { col, ascending: options?.ascending !== false }
    return this
  }

  range(from: number, to: number) {
    this.spec.range = { from, to }
    return this
  }

  limit(value: number) {
    this.spec.limit = value
    return this
  }

  single() {
    this.spec.single = true
    return this
  }

  insert(payload: unknown) {
    this.spec.op = 'insert'
    this.spec.payload = payload
    return this
  }

  update(payload: unknown) {
    this.spec.op = 'update'
    this.spec.payload = payload
    return this
  }

  delete() {
    this.spec.op = 'delete'
    return this
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return runQuery(this.spec).then(onfulfilled, onrejected)
  }
}

/** A API do Supabase devolve no máximo 1000 linhas por requisição. */
const API_MAX_ROWS = 1000

function isUnboundedSelect(spec: QuerySpec): boolean {
  return (
    spec.op === 'select' &&
    !spec.range &&
    spec.limit == null &&
    !spec.single &&
    spec.head !== true
  )
}

/** Busca todas as páginas de um select sem limite (evita cortar dados em 1000 linhas). */
async function runPagedSelect(spec: QuerySpec): Promise<QueryResult> {
  const rows: unknown[] = []
  let count: number | null = null

  for (let from = 0; ; from += API_MAX_ROWS) {
    const page = await runQuery({
      ...spec,
      orderBy: spec.orderBy ?? { col: 'id', ascending: true },
      range: { from, to: from + API_MAX_ROWS - 1 },
    })
    if (page.error) return page

    const pageRows = Array.isArray(page.data) ? page.data : []
    rows.push(...pageRows)
    count = page.count ?? count
    if (pageRows.length < API_MAX_ROWS) break
  }

  return { data: rows, error: null, count }
}

async function runQuery(spec: QuerySpec): Promise<QueryResult> {
  if (isUnboundedSelect(spec)) return runPagedSelect(spec)

  try {
    const client = createClient()
    const table = resolveTable(spec.table)
    const columns = snakeColumns(spec.columns || '*')

    let query: AnyQuery

    if (spec.op === 'insert') {
      const payload = snakePayload(spec.payload) as Record<string, unknown> | Record<string, unknown>[]
      query = client.from(table).insert(payload).select(columns)
    } else if (spec.op === 'update') {
      const payload = snakePayload(spec.payload) as Record<string, unknown>
      query = client.from(table).update(payload).select(columns)
    } else if (spec.op === 'delete') {
      query = client.from(table).delete().select(columns)
    } else {
      query = client.from(table).select(columns, {
        count: spec.count ? 'exact' : undefined,
        head: spec.head === true,
      })
    }

    for (const filter of spec.filters) {
      switch (filter.type) {
        case 'eq':
          query = query.eq(snakeCol(filter.col), filter.value)
          break
        case 'neq':
          query = query.neq(snakeCol(filter.col), filter.value)
          break
        case 'gte':
          query = query.gte(snakeCol(filter.col), filter.value)
          break
        case 'lte':
          query = query.lte(snakeCol(filter.col), filter.value)
          break
        case 'in':
          query = query.in(snakeCol(filter.col), filter.value)
          break
        case 'not':
          query = query.not(snakeCol(filter.col), filter.operator, filter.value)
          break
        case 'or':
          query = query.or(filter.expr)
          break
        default:
          break
      }
    }

    if (spec.orderBy) {
      query = query.order(snakeCol(spec.orderBy.col), {
        ascending: spec.orderBy.ascending,
      })
    }
    if (spec.range) {
      query = query.range(spec.range.from, spec.range.to)
    }
    if (spec.limit != null) {
      query = query.limit(spec.limit)
    }
    if (spec.single) {
      query = query.single()
    }

    const { data, error, count } = await query

    return {
      data: dualCaseRows(data),
      error: error ? { message: error.message } : null,
      count: count ?? null,
    }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Falha ao consultar o banco de dados',
      },
      count: null,
    }
  }
}

/**
 * Compat layer: `supabase.from()` + `supabase.auth` para services existentes.
 * Queries vão direto ao Supabase (browser client); auth usa sessão real.
 */
export const supabase = {
  from(table: string) {
    return new QueryBuilder(table)
  },
  auth: {
    async getSession(): Promise<SessionPayload> {
      try {
        const client = createClient()
        const { data } = await client.auth.getSession()
        const user = mapAuthUser(data.session?.user)
        return { data: { session: user ? { user } : null } }
      } catch {
        return { data: { session: null } }
      }
    },
    onAuthStateChange(listener: AuthListener) {
      const client = createClient()
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, session) => {
        const user = mapAuthUser(session?.user)
        listener(event, user ? { user } : null)
      })
      return { data: { subscription } }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const client = createClient()
      const { data, error } = await client.auth.signInWithPassword({ email, password })

      if (error) {
        return {
          data: { session: null, user: null },
          error: { message: error.message },
        }
      }

      const user = mapAuthUser(data.user)
      return {
        data: {
          session: user ? { user } : null,
          user,
        },
        error: null,
      }
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string
      password: string
      options?: { data?: Record<string, unknown> }
    }) {
      const client = createClient()
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: options?.data ? { data: options.data } : undefined,
      })

      if (error) {
        return {
          data: { session: null, user: null },
          error: { message: error.message },
        }
      }

      const user = mapAuthUser(data.user)
      return {
        data: {
          session: user && data.session ? { user } : null,
          user,
        },
        error: null,
      }
    },
    async signOut() {
      const client = createClient()
      const { error } = await client.auth.signOut()
      return { error: error ? { message: error.message } : null }
    },
  },
}

export type { AuthUser } from '@/lib/auth/types'
