// src/features/instrucoes/hooks/useNovaInstrucao.tsx
import { useCallback, useRef, useState } from 'react';
import { InstrucoesModal } from '../components/InstrucoesModal';
import { instrucoesFormFields } from '../config/form-config';
import {
  InstrucoesApiService,
  type CreateInstrucaoApiData,
  type InstrucaoApiResponse,
} from '@/services/instrucoes.services';
import { useUserStore } from '@/store/useUserStore';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';

const instrucoesApi = new InstrucoesApiService();

/**
 * Campos que o servidor gerencia e que o BaseModal devolve junto porque semeia
 * o formulário com a entidade inteira. Mandá-los de volta faz o
 * `forbidNonWhitelisted` do backend recusar o create com 400.
 */
const CAMPOS_DO_SERVIDOR = [
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'total_sub_instrucoes',
  'total_recursos',
  'total_anexos',
  'total_tarefas_derivadas',
  'usuario_criador',
  'usuario_atualizador',
  'criado_por',
  'atualizado_por',
  'anexos',
];

/**
 * Cadastrar uma instrução sem sair da tela onde ela vai ser usada.
 *
 * Quem monta um plano descobre a instrução que falta no momento de escolhê-la
 * no combobox. Sem isto, o caminho era sair do plano, ir em Manutenção →
 * Instruções, cadastrar, voltar e recomeçar a tarefa — e no sheet do
 * equipamento isso significava perder o que já estava preenchido.
 *
 * `abrirNovaInstrucao()` devolve uma PROMESSA que resolve com a instrução
 * criada (ou `null` se o usuário desistiu). Assim quem chamou continua de onde
 * parou — seleciona o que acabou de cadastrar — em vez de precisar de um
 * segundo callback e de um estado "instrução recém-criada" viajando por props.
 *
 * O sheet é montado por quem usa o hook, e não lá dentro da lista de tarefas:
 * ele abre por cima do sheet do equipamento, e modal dentro de modal precisa
 * do controle no nível de cima (mesma razão do `PlanoDoEquipamentoWrapper`).
 */
export function useNovaInstrucao(aoCriar?: (instrucao: InstrucaoApiResponse) => void) {
  const { user } = useUserStore();

  const [aberto, setAberto] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Guarda o `resolve` da promessa devolvida por abrirNovaInstrucao, para o
  // submit (ou o fechar) responder a quem está esperando.
  const resolverRef = useRef<((instrucao: InstrucaoApiResponse | null) => void) | null>(null);

  const responder = useCallback((instrucao: InstrucaoApiResponse | null) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    resolver?.(instrucao);
  }, []);

  const abrirNovaInstrucao = useCallback(
    () =>
      new Promise<InstrucaoApiResponse | null>((resolve) => {
        // Abrir de novo com um pedido pendente encerra o anterior; deixá-lo
        // pendurado travaria o `await` de quem chamou primeiro.
        responder(null);
        resolverRef.current = resolve;
        setPendingFiles([]);
        setAberto(true);
      }),
    [responder],
  );

  const fechar = useCallback(() => {
    setAberto(false);
    setPendingFiles([]);
    responder(null);
  }, [responder]);

  const submeter = useCallback(
    async (dados: Record<string, unknown>) => {
      if (!user?.id) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para cadastrar instruções.',
          variant: 'destructive',
        });
        return;
      }

      const payload = { ...dados };
      CAMPOS_DO_SERVIDOR.forEach((campo) => delete payload[campo]);

      try {
        // O BaseModal entrega o formData solto; a forma tipada é a do DTO, e
        // quem valida de verdade é o backend.
        const nova = await instrucoesApi.create({
          ...payload,
          criado_por: user.id,
        } as unknown as CreateInstrucaoApiData);

        // Anexo que falha não desfaz a instrução: ela já existe e é o que o
        // usuário veio buscar. O aviso diz qual arquivo ficou de fora.
        for (const arquivo of pendingFiles) {
          try {
            await instrucoesApi.uploadAnexo(nova.id, arquivo, `Anexo: ${arquivo.name}`, user.id);
          } catch (erro) {
            toast({
              title: `Instrução criada, mas o anexo "${arquivo.name}" falhou`,
              description: formatApiError(erro),
              variant: 'destructive',
            });
          }
        }

        setAberto(false);
        setPendingFiles([]);
        aoCriar?.(nova);
        responder(nova);
        toast({ title: `Instrução ${nova.tag} criada` });
      } catch (erro) {
        // O sheet fica aberto de propósito: o preenchimento continua lá para
        // corrigir o que o backend recusou.
        toast({
          title: 'Erro ao criar instrução',
          description: formatApiError(erro),
          variant: 'destructive',
        });
      }
    },
    [user?.id, pendingFiles, aoCriar, responder],
  );

  const novaInstrucaoModal = (
    <InstrucoesModal
      isOpen={aberto}
      mode="create"
      entity={null}
      formFields={instrucoesFormFields}
      onClose={fechar}
      onSubmit={submeter}
      onFilesChange={setPendingFiles}
    />
  );

  return { abrirNovaInstrucao, novaInstrucaoModal };
}
