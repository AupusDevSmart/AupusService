import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsuariosService } from '@/services/usuarios.services';
import {
  plantaOperadoresService,
  type PlantaOperadorVinculo,
} from '@/services/planta-operadores.service';

interface OperadorDisponivel {
  id: string;
  nome: string;
  email: string;
}

export default function PlantaOperadoresPage() {
  const { plantaId = '' } = useParams<{ plantaId: string }>();
  const navigate = useNavigate();
  const [vinculos, setVinculos] = useState<PlantaOperadorVinculo[]>([]);
  const [operadoresDisponiveis, setOperadoresDisponiveis] = useState<OperadorDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selecionado, setSelecionado] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const idsVinculados = useMemo(
    () => new Set(vinculos.map((v) => v.usuario_id.trim())),
    [vinculos],
  );

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const lista = await plantaOperadoresService.list(plantaId.trim());
      setVinculos(lista);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao carregar operadores');
    } finally {
      setLoading(false);
    }
  }, [plantaId]);

  const carregarDisponiveis = useCallback(async () => {
    try {
      const res = await UsuariosService.getAllUsuarios({ role: 'operador', limit: 200 } as any);
      const items = (res.data || []).map((u: any) => ({
        id: String(u.id).trim(),
        nome: u.nome,
        email: u.email,
      }));
      setOperadoresDisponiveis(items.filter((u) => !idsVinculados.has(u.id)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao listar operadores disponiveis');
    }
  }, [idsVinculados]);

  useEffect(() => {
    if (plantaId) void carregar();
  }, [plantaId, carregar]);

  useEffect(() => {
    if (open) void carregarDisponiveis();
  }, [open, carregarDisponiveis]);

  const handleAdicionar = async () => {
    if (!selecionado) return;
    try {
      setSaving(true);
      await plantaOperadoresService.add(plantaId.trim(), selecionado);
      toast.success('Operador vinculado');
      setOpen(false);
      setSelecionado('');
      await carregar();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao vincular');
    } finally {
      setSaving(false);
    }
  };

  const handleRemover = async (usuarioId: string) => {
    try {
      await plantaOperadoresService.remove(plantaId.trim(), usuarioId.trim());
      toast.success('Operador desvinculado');
      await carregar();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao desvincular');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold">Operadores da planta</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Operadores vinculados</CardTitle>
            <CardDescription>
              Operadores aqui listados tem acesso aos dados desta planta (dashboard e anomalias).
            </CardDescription>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-1" />
                Vincular operador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular operador</DialogTitle>
                <DialogDescription>
                  Selecione um usuario com role "operador" que ainda nao esta vinculado a esta planta.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <Select value={selecionado} onValueChange={setSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadoresDisponiveis.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum operador disponivel.
                      </div>
                    )}
                    {operadoresDisponiveis.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.nome} — {op.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionar} disabled={!selecionado || saving}>
                  Vincular
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : vinculos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum operador vinculado a esta planta.
            </p>
          ) : (
            <ul className="divide-y">
              {vinculos.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{v.usuario?.nome}</p>
                    <p className="text-xs text-muted-foreground">{v.usuario?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemover(v.usuario_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Desvincular
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
