import { EntityDirectory } from '@/components/dashboard/EntityDirectory'

export default function ConstrutorasPage() {
  return (
    <EntityDirectory
      field="construtora"
      title="Construtoras"
      singular="Construtora"
      description="Carteira, volume de clientes, vendas realizadas e VGV por construtora."
      relationField="cidade"
      relationLabel="Cidades"
    />
  )
}
