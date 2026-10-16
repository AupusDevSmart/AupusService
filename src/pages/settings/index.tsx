import { Layout } from '@/components/common/Layout'
import { TitleCard } from '@/components/common/title-card'
import { AccountForm } from '@/features/configuracoes/perfil/account-form'
import { PreferenciasDeNotificacao } from '@/features/notificacoes/components/PreferenciasDeNotificacao'

export function Settings() {
  return (
    <Layout>
      <Layout.Main>
        <TitleCard
          title={'Perfil'}
          description={'Gerencie seu perfil e suas informações pessoais.'}
        />
        <AccountForm />
        <div className="mt-6">
          <PreferenciasDeNotificacao />
        </div>
      </Layout.Main>
    </Layout>
  )
}