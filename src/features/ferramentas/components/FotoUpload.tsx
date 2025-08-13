// src/features/ferramentas/components/FotoUpload.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

// ✅ COMPONENTE: Upload de Foto
export const FotoUpload = ({ value, onChange, disabled }: FormFieldProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerFoto = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Foto da Ferramenta</label>
      
      {value ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img 
              src={typeof value === 'string' ? value : ''} 
              alt="Foto da ferramenta" 
              className="w-32 h-24 object-cover rounded-lg border"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removerFoto}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Foto carregada com sucesso
          </p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Clique para adicionar uma foto da ferramenta
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            id="foto-upload-ferramenta"
          />
          <label
            htmlFor="foto-upload-ferramenta"
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-4 w-4" />
            Selecionar Foto
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            PNG, JPG até 5MB
          </p>
        </div>
      )}
    </div>
  );
};