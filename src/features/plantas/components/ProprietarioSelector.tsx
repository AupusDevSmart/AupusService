// src/features/plantas/components/ProprietarioSelector.tsx
import React, { useState, useMemo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, User } from 'lucide-react';

// Mock data dos proprietários (normalmente viria da API)
const mockProprietarios = [
  { 
    id: 1, 
    razaoSocial: 'Empresa ABC Ltda', 
    cnpjCpf: '12.345.678/0001-90',
    tipo: 'pessoa_juridica' as const
  },
  { 
    id: 2, 
    razaoSocial: 'João Silva', 
    cnpjCpf: '123.456.789-00',
    tipo: 'pessoa_fisica' as const
  },
  { 
    id: 3, 
    razaoSocial: 'Maria Santos Consultoria ME', 
    cnpjCpf: '98.765.432/0001-10',
    tipo: 'pessoa_juridica' as const
  },
  { 
    id: 4, 
    razaoSocial: 'Tech Solutions Ltda', 
    cnpjCpf: '11.222.333/0001-44',
    tipo: 'pessoa_juridica' as const
  },
  { 
    id: 5, 
    razaoSocial: 'Ana Costa', 
    cnpjCpf: '987.654.321-00',
    tipo: 'pessoa_fisica' as const
  },
  { 
    id: 6, 
    razaoSocial: 'Indústria XYZ S.A.', 
    cnpjCpf: '55.666.777/0001-88',
    tipo: 'pessoa_juridica' as const
  }
];

interface ProprietarioSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}

export const ProprietarioSelector: React.FC<ProprietarioSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar proprietários baseado na busca
  const filteredProprietarios = useMemo(() => {
    if (!searchTerm.trim()) return mockProprietarios;
    
    const term = searchTerm.toLowerCase();
    return mockProprietarios.filter(prop => 
      prop.razaoSocial.toLowerCase().includes(term) ||
      prop.cnpjCpf.includes(term)
    );
  }, [searchTerm]);

  // Encontrar proprietário selecionado
  const selectedProprietario = mockProprietarios.find(prop => prop.id === value);

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onChange(null);
    } else {
      onChange(parseInt(newValue));
    }
    setIsOpen(false);
  };

  const getProprietarioIcon = (tipo: 'pessoa_fisica' | 'pessoa_juridica') => {
    return tipo === 'pessoa_juridica' 
      ? <Building2 className="h-3 w-3" />
      : <User className="h-3 w-3" />;
  };

  const getProprietarioBadgeColor = (tipo: 'pessoa_fisica' | 'pessoa_juridica') => {
    return tipo === 'pessoa_juridica'
      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
      : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300";
  };

  return (
    <div className="space-y-2">
      <Select
        value={value ? String(value) : undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um proprietário">
            {selectedProprietario && (
              <div className="flex items-center gap-2">
                {getProprietarioIcon(selectedProprietario.tipo)}
                <span className="truncate">{selectedProprietario.razaoSocial}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getProprietarioBadgeColor(selectedProprietario.tipo)}`}
                >
                  {selectedProprietario.tipo === 'pessoa_juridica' ? 'PJ' : 'PF'}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="max-h-80">
          {/* Campo de busca - só mostrar se não estiver desabilitado */}
          {!disabled && (
            <div className="sticky top-0 z-10 bg-background p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proprietário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Opção "Nenhum" - só mostrar se não estiver desabilitado */}
          {!disabled && (
            <SelectItem value="none" className="text-muted-foreground">
              Nenhum proprietário
            </SelectItem>
          )}

          {/* Lista de proprietários filtrados */}
          {filteredProprietarios.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum proprietário encontrado
            </div>
          ) : (
            filteredProprietarios.map((proprietario) => (
              <SelectItem key={proprietario.id} value={String(proprietario.id)}>
                <div className="flex items-center gap-3 w-full">
                  {getProprietarioIcon(proprietario.tipo)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {proprietario.razaoSocial}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {proprietario.cnpjCpf}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getProprietarioBadgeColor(proprietario.tipo)}`}
                  >
                    {proprietario.tipo === 'pessoa_juridica' ? 'PJ' : 'PF'}
                  </Badge>
                </div>
              </SelectItem>
            ))
          )}

          {/* Informação de resultados */}
          {!disabled && searchTerm.trim() && (
            <div className="sticky bottom-0 bg-muted/50 p-2 text-xs text-muted-foreground text-center border-t">
              {filteredProprietarios.length} proprietário(s) encontrado(s)
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Informações do proprietário selecionado */}
      {selectedProprietario && (
        <div className="p-3 bg-muted/30 rounded-md border">
          <div className="flex items-center gap-2 text-sm">
            {getProprietarioIcon(selectedProprietario.tipo)}
            <span className="font-medium">{selectedProprietario.razaoSocial}</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getProprietarioBadgeColor(selectedProprietario.tipo)}`}
            >
              {selectedProprietario.tipo === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
            </Badge>
            {/* ✅ NOVO: Mostrar quando está pré-selecionado */}
            {disabled && (
              <Badge variant="secondary" className="text-xs">
                Pré-selecionado
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {selectedProprietario.tipo === 'pessoa_juridica' ? 'CNPJ' : 'CPF'}: {selectedProprietario.cnpjCpf}
          </div>
        </div>
      )}
    </div>
  );
};