/** Opção de select/filtro (cadastro tipado ou string legada). */
export type TeamFilterOption =
  | string
  | {
      value: string
      label: string
      coordenadorId?: string | null
    }

export function toSelectOptions(
  list: TeamFilterOption[] | undefined | null,
): Array<{ value: string; label: string }> {
  return (list || []).map((item) =>
    typeof item === 'string' ? { value: item, label: item } : { value: item.value, label: item.label },
  )
}

export function optionValue(item: TeamFilterOption): string {
  return typeof item === 'string' ? item : item.value
}

export function optionLabel(item: TeamFilterOption): string {
  return typeof item === 'string' ? item : item.label
}

export function findOptionLabel(
  list: TeamFilterOption[] | undefined | null,
  value: string,
): string {
  const found = (list || []).find((item) => optionValue(item) === value)
  return found ? optionLabel(found) : value
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isTeamUuid(value: string): boolean {
  return UUID_RE.test(value)
}
