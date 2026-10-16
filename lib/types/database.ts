/**
 * Tipos do schema CRM (espelho das tabelas públicas).
 * Regenerar com `npx supabase gen types typescript --project-id dqmxwaoynkfgopmyxcvo`
 * quando o MCP/CLI tiverem acesso ao projeto destino.
 */

export type EtapaFunil =
  | 'lead'
  | 'analise'
  | 'aprovado'
  | 'especulativo'
  | 'realizado'
  | 'reprovado'
  | 'visita'

export type Database = {
  public: {
    Tables: {
      coordenadores: {
        Row: {
          id: string
          nome: string
          email: string | null
          telefone: string | null
          ativo: boolean
          user_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Partial<Database['public']['Tables']['coordenadores']['Row']> & {
          nome: string
        }
        Update: Partial<Database['public']['Tables']['coordenadores']['Row']>
      }
      corretores: {
        Row: {
          id: string
          nome: string
          email: string | null
          telefone: string | null
          ativo: boolean
          coordenador_id: string | null
          user_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Partial<Database['public']['Tables']['corretores']['Row']> & {
          nome: string
        }
        Update: Partial<Database['public']['Tables']['corretores']['Row']>
      }
      correspondentes_bancarios: {
        Row: {
          id: string
          nome: string
          banco: string | null
          contato: string | null
          email: string | null
          telefone: string | null
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: Partial<Database['public']['Tables']['correspondentes_bancarios']['Row']> & {
          nome: string
        }
        Update: Partial<Database['public']['Tables']['correspondentes_bancarios']['Row']>
      }
      cidades: {
        Row: {
          id: string
          nome: string
          uf: string
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: Partial<Database['public']['Tables']['cidades']['Row']> & { nome: string }
        Update: Partial<Database['public']['Tables']['cidades']['Row']>
      }
      construtoras: {
        Row: {
          id: string
          nome: string
          cidade: string | null
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: Partial<Database['public']['Tables']['construtoras']['Row']> & { nome: string }
        Update: Partial<Database['public']['Tables']['construtoras']['Row']>
      }
      leads: {
        Row: {
          id: string
          nome: string
          cpf: string | null
          telefone: string | null
          email: string | null
          cidade: string | null
          zona: string | null
          etapa: EtapaFunil
          corretor: string | null
          coordenador: string | null
          construtora: string | null
          origem: string | null
          modalidade: string | null
          tipo_renda: string | null
          comprovacao: string | null
          tipo_imovel: string | null
          categoria_imovel: string | null
          vgv: number | null
          valor_avaliacao: number | null
          valor_fecho: number | null
          chb: number | null
          ccv: boolean
          faturamento_previsto: number | null
          correspondente: string | null
          situacao_reprovado: string | null
          observacao: string | null
          id_imobilead: string | null
          criado_em: string
          atualizado_em: string
          coordenador_id: string | null
          corretor_id: string | null
          correspondente_id: string | null
          corretor_origem: string | null
        }
        Insert: Partial<Database['public']['Tables']['leads']['Row']> & {
          id: string
          nome: string
          etapa: EtapaFunil
          criado_em: string
          atualizado_em: string
        }
        Update: Partial<Database['public']['Tables']['leads']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      etapa_funil: EtapaFunil
    }
  }
}
