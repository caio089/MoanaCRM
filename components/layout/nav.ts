export const PAGE_TITLES: Record<string, string> = {
  '/visao': 'Visão Geral',
  '/leads': 'Leads',
  '/kanban': 'Kanban',
  '/analises': 'Análise',
  '/aprovados': 'Aprovados',
  '/especulativo': 'Especulativo',
  '/realizado': 'Realizado',
  '/reprovado': 'Reprovado',
  '/visitas': 'Visitas',
  '/equipe': 'Equipe',
  '/admin': 'Gerenciamento',
  '/admin/distribuicao': 'Distribuir leads',
  '/admin/coordenadores': 'Coordenadores',
  '/admin/corretores': 'Corretores',
  '/admin/correspondentes': 'Correspondentes',
  '/admin/cidades': 'Cidades',
  '/admin/construtoras': 'Construtoras',
  '/novo-lead': 'Novo Lead',
}

export function titleFromPath(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/equipe/coordenadores/')) return 'Coordenador'
  if (pathname.startsWith('/equipe/corretores/')) return 'Corretor'
  if (pathname.startsWith('/equipe')) return 'Equipe'
  return 'Dashboard'
}
