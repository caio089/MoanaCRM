'use client'

import { CreateLeadForm } from '@/components/leads/CreateLeadForm'
import { PageHeading } from '@/components/ui/PageHeading'

export default function NovoLeadPage() {
  return (
    <div className="page-section">
      <PageHeading
        title="Novo lead"
        description="Preencha os dados em abas para organizar cadastro, renda e imóvel."
      />

      <div className="card p-5 sm:p-7">
        <CreateLeadForm />
      </div>
    </div>
  )
}
