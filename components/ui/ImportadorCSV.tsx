'use client'

import { useState, useRef, useCallback } from 'react'
import { importarHistorico } from '@/app/actions/importarHistorico'

const CAMPOS_DB = [
  { key: 'id',                  label: 'ID *',                obrigatorio: true  },
  { key: 'nome',                label: 'Nome *',              obrigatorio: true  },
  { key: 'etapa',               label: 'Etapa *',             obrigatorio: true  },
  { key: 'cpf',                 label: 'CPF',                 obrigatorio: false },
  { key: 'telefone',            label: 'Telefone',            obrigatorio: false },
  { key: 'cidade',              label: 'Cidade',              obrigatorio: false },
  { key: 'zona',                label: 'Zona',                obrigatorio: false },
  { key: 'corretor',            label: 'Corretor',            obrigatorio: false },
  { key: 'coordenador',         label: 'Coordenador',         obrigatorio: false },
  { key: 'construtora',         label: 'Construtora',         obrigatorio: false },
  { key: 'origem',              label: 'Origem',              obrigatorio: false },
  { key: 'modalidade',          label: 'Modalidade',          obrigatorio: false },
  { key: 'tipo_renda',          label: 'Tipo de Renda',       obrigatorio: false },
  { key: 'comprovacao',         label: 'Comprovação',         obrigatorio: false },
  { key: 'tipo_imovel',         label: 'Tipo de Imóvel',      obrigatorio: false },
  { key: 'vgv',                 label: 'VGV',                 obrigatorio: false },
  { key: 'valor_avaliacao',     label: 'Valor de Avaliação',  obrigatorio: false },
  { key: 'valor_fecho',         label: 'Valor de Fecho',      obrigatorio: false },
  { key: 'chb',                 label: 'CHB',                 obrigatorio: false },
  { key: 'ccv',                 label: 'CCV',                 obrigatorio: false },
  { key: 'faturamento_previsto',label: 'Fat. Previsto',       obrigatorio: false },
  { key: 'correspondente',      label: 'Correspondente',      obrigatorio: false },
  { key: 'situacao_reprovado',  label: 'Situação Reprovado',  obrigatorio: false },
  { key: 'observacao',          label: 'Observação',          obrigatorio: false },
  { key: 'atualizado_em',       label: 'Atualizado Em',       obrigatorio: false },
  { key: 'criado_em',           label: 'Criado Em',           obrigatorio: false },
]

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else { inQuote = !inQuote }
      } else if ((c === ',' || c === ';') && !inQuote) {
        cols.push(cur.trim()); cur = ''
      } else {
        cur += c
      }
    }
    cols.push(cur.trim())
    return cols
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

function autoMap(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[\s_-]/g, '').replace(/ã/g, 'a').replace(/é/g, 'e').replace(/ç/g, 'c').replace(/á/g, 'a').replace(/à/g, 'a').replace(/ü/g, 'u').replace(/ó/g, 'o')

  // Mapeamento explícito para colunas - nomes exatos do CSV
  const mapeamentoExplicito: Record<string, string[]> = {
    id: ['lead id', 'leadid', 'id', 'codigo', 'numero'],
    nome: ['cliente', 'nome', 'nomecliente', 'client_name'],
    cpf: ['cpf', 'cpfnumber'],
    telefone: ['telefone', 'phone', 'tel'],
    cidade: ['cidade', 'city'],
    zona: ['zona', 'zone'],
    etapa: ['etapa', 'stage', 'status'],
    corretor: ['corretor', 'agent', 'broker'],
    coordenador: ['coordenador', 'coordinator'],
    construtora: ['construtora', 'builder', 'constructor'],
    origem: ['origem', 'source', 'origemdolead'],
    modalidade: ['modalidade', 'modality'],
    tipo_renda: ['tiporenda', 'tipo de renda', 'incotype'],
    comprovacao: ['comprovacao', 'comprovacao de renda', 'proof'],
    tipo_imovel: ['tipo', 'tipo de imovel', 'propertytype'],
    vgv: ['vgv', 'valor', 'amount'],
    valor_avaliacao: ['avaliacao', 'valor avaliado'],
    valor_fecho: ['valor fechado', 'valorfecho'],
    correspondente: ['correspondente', 'correspondent'],
    observacao: ['observacao', 'observation', 'note'],
  }

  for (const h of headers) {
    const hn = normalize(h)

    // Primeiro tenta mapeamento explícito
    let encontrou = false
    for (const [campo, aliases] of Object.entries(mapeamentoExplicito)) {
      if (aliases.some(alias => hn === alias || hn.includes(alias) || alias.includes(hn))) {
        if (!mapping[campo]) mapping[campo] = h
        encontrou = true
        break
      }
    }

    // Se não encontrou, tenta match com CAMPOS_DB
    if (!encontrou) {
      for (const campo of CAMPOS_DB) {
        const cn = normalize(campo.key)
        if (hn === cn || hn.includes(cn) || cn.includes(hn)) {
          if (!mapping[campo.key]) mapping[campo.key] = h
          break
        }
      }
    }
  }
  return mapping
}

interface ResultadoImport {
  inseridos: number
  atualizados: number
  erros: { linha: number; motivo: string }[]
  total: number
}

export function ImportadorCSV() {
  const [isDragging, setIsDragging] = useState(false)
  const [headers, setHeaders]       = useState<string[]>([])
  const [rows, setRows]             = useState<string[][]>([])
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado]   = useState<ResultadoImport | null>(null)
  const [erro, setErro]             = useState<string | null>(null)
  const [modoAvancado, setModoAvancado] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processarArquivo = useCallback((file: File) => {
    setResultado(null); setErro(null)

    const maxSizeMB = 50
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      setErro(`Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows: r } = parseCSV(text)
      if (!h.length) { setErro('Arquivo CSV sem cabeçalho ou vazio.'); return }
      setHeaders(h)
      setRows(r)
      setMapeamento(autoMap(h))
    }
    reader.onerror = () => {
      setErro('Erro ao ler o arquivo. Tente novamente.')
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processarArquivo(file)
  }, [processarArquivo])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
  }, [processarArquivo])

  const importar = async () => {
    if (!rows.length) return
    setCarregando(true); setResultado(null); setErro(null)

    const CHUNK_SIZE = 500
    let totalInseridos = 0
    let totalAtualizados = 0
    const todosErros: { linha: number; motivo: string }[] = []

    try {
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE)
        const leadsJSON = chunk.map(row => {
          const obj: Record<string, string> = {}
          for (const [campoDb, colCSV] of Object.entries(mapeamento)) {
            if (!colCSV) continue
            const idx = headers.indexOf(colCSV)
            if (idx >= 0) obj[campoDb] = row[idx] ?? ''
          }
          return obj
        })

        const data = await importarHistorico(leadsJSON)
        totalInseridos += data.inseridos
        totalAtualizados += data.atualizados
        todosErros.push(...data.erros.map(e => ({ ...e, linha: e.linha + i })))
      }

      setResultado({
        inseridos: totalInseridos,
        atualizados: totalAtualizados,
        erros: todosErros,
        total: rows.length,
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setCarregando(false)
    }
  }

  const resetar = () => {
    setHeaders([]); setRows([]); setMapeamento({}); setResultado(null); setErro(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const camposObrigatoriosMapeados = CAMPOS_DB.filter(c => c.obrigatorio).every(c => mapeamento[c.key])

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      {!headers.length && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant hover:border-primary/50 hover:bg-surface-high',
          ].join(' ')}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          <svg className="mx-auto mb-3 text-on-surface-variant" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-label-md text-on-surface">Arraste o CSV aqui ou clique para selecionar</p>
          <p className="text-label-sm text-on-surface-variant mt-1">Exportação de negociações do Imoblead (.csv)</p>
        </div>
      )}

      {/* Dados carregados */}
      {headers.length > 0 && !resultado && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-md text-on-surface">
                <span className="text-primary font-semibold">{rows.length}</span> registros carregados
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {headers.length} colunas detectadas
              </p>
            </div>
            <button onClick={resetar} className="text-label-sm text-on-surface-variant hover:text-error transition-colors">
              Trocar arquivo
            </button>
          </div>

          {/* Toggle Modo Simples/Avançado */}
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-1.5">
            <button
              onClick={() => setModoAvancado(false)}
              className={`flex-1 px-3 py-2 rounded text-label-sm font-medium transition-colors ${
                !modoAvancado
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Importar Agora
            </button>
            <button
              onClick={() => setModoAvancado(true)}
              className={`flex-1 px-3 py-2 rounded text-label-sm font-medium transition-colors ${
                modoAvancado
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Ajustar Mapeamento
            </button>
          </div>

          {/* Preview de dados */}
          <div className="overflow-x-auto rounded-lg border border-outline-variant max-h-40 overflow-y-auto">
            <table className="w-full text-label-sm">
              <thead className="sticky top-0 bg-surface-high">
                <tr>
                  {headers.map(h => (
                    <th key={h} className="px-3 py-2 text-left text-on-surface-variant whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 2).map((row, i) => (
                  <tr key={i} className="border-t border-outline-variant/50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-on-surface-variant whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modo Avançado: Mapeamento manual */}
          {modoAvancado && (
            <div className="space-y-3 bg-surface-high rounded p-4 border border-outline-variant">
              <p className="text-label-sm text-on-surface-variant">
                Ajuste o mapeamento de colunas (campos com * são obrigatórios)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CAMPOS_DB.map(campo => (
                  <div key={campo.key} className="flex flex-col gap-1.5">
                    <label className="text-label-sm text-on-surface-variant">
                      {campo.label}
                    </label>
                    <select
                      value={mapeamento[campo.key] ?? ''}
                      onChange={e => setMapeamento(prev => ({ ...prev, [campo.key]: e.target.value }))}
                      className="bg-surface border border-outline rounded px-2 py-1.5 text-on-surface text-label-sm"
                    >
                      <option value="">— ignorar —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensagens */}
          {erro && (
            <p className="text-label-sm text-error bg-error/10 rounded px-3 py-2">{erro}</p>
          )}

          {modoAvancado && !camposObrigatoriosMapeados && (
            <p className="text-label-sm text-on-surface-variant bg-surface-high rounded px-3 py-2 text-center">
              Mapeie os campos obrigatórios (ID *, Nome *, Etapa *)
            </p>
          )}

          {/* Botão importar */}
          <button
            onClick={importar}
            disabled={carregando || (modoAvancado && !camposObrigatoriosMapeados)}
            className="btn-primary w-full disabled:opacity-40"
          >
            {carregando ? 'Importando…' : `Importar ${rows.length} registros`}
          </button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary/10 mb-3">
              <svg className="w-8 h-8 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-headline-sm font-semibold text-on-surface">Importação concluída!</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="bg-surface-high rounded px-3 py-3 text-center">
              <p className="text-label-sm text-on-surface-variant mb-1">Inseridos</p>
              <p className="text-headline-sm font-bold text-tertiary">{resultado.inseridos}</p>
            </div>
            <div className="bg-surface-high rounded px-3 py-3 text-center">
              <p className="text-label-sm text-on-surface-variant mb-1">Atualizados</p>
              <p className="text-headline-sm font-bold text-primary">{resultado.atualizados}</p>
            </div>
            <div className="bg-surface-high rounded px-3 py-3 text-center">
              <p className="text-label-sm text-on-surface-variant mb-1">Erros</p>
              <p className={`text-headline-sm font-bold ${resultado.erros.length ? 'text-error' : 'text-on-surface-variant'}`}>
                {resultado.erros.length}
              </p>
            </div>
          </div>

          {resultado.erros.length > 0 && (
            <div className="bg-error/5 border border-error/20 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-label-sm text-error font-semibold mb-2">Linhas com erro:</p>
              {resultado.erros.map((e, i) => (
                <p key={i} className="text-label-sm text-on-surface-variant mb-1">
                  Linha {e.linha}: {e.motivo}
                </p>
              ))}
            </div>
          )}

          <button onClick={resetar} className="btn-ghost w-full">
            Importar outro arquivo
          </button>
        </div>
      )}
    </div>
  )
}
