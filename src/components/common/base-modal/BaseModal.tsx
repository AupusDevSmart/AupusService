// src/components/common/base-modal/BaseModal.tsx - ATUALIZADO
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseEntity, ModalMode, FormField } from '@/types/base';
import { BaseForm } from './BaseForm';

interface BaseModalProps<T extends BaseEntity> {
  isOpen: boolean;
  mode: ModalMode;
  entity: T | null;
  title: string;
  icon?: React.ReactNode;
  formFields: FormField[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  width?: string;
  children?: React.ReactNode;
  groups?: { key: string; title: string }[];
}

export function BaseModal<T extends BaseEntity>({
  isOpen,
  mode,
  entity,
  title,
  icon,
  formFields,
  onClose,
  onSubmit,
  width = "w-[500px]",
  children,
  groups
}: BaseModalProps<T>) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // Resetar form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (entity && (isViewMode || isEditMode)) {
        setFormData({ ...entity });
      } else if (entity && isCreateMode) {
        // ✅ NOVO: Para modo create com dados iniciais
        setFormData({ ...entity });
      } else {
        // Criar objeto inicial baseado nos campos do formulário
        const initialData: any = {};
        formFields.forEach(field => {
          if (field.key.includes('.')) {
            const [parent, child] = field.key.split('.');
            if (!initialData[parent]) initialData[parent] = {};
            initialData[parent][child] = '';
          } else {
            initialData[field.key] = '';
          }
        });
        setFormData(initialData);
      }
      setErrors({});
    }
  }, [isOpen, entity, mode, formFields, isViewMode, isEditMode, isCreateMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const newErrors: Record<string, string> = {};
    formFields.forEach(field => {
      if (field.required) {
        const value = field.key.includes('.') 
          ? formData[field.key.split('.')[0]]?.[field.key.split('.')[1]]
          : formData[field.key];
        
        if (!value || String(value).trim() === '') {
          newErrors[field.key] = `${field.label} é obrigatório`;
        }
      }
      
      // Validação customizada
      if (field.validation) {
        const value = field.key.includes('.') 
          ? formData[field.key.split('.')[0]]?.[field.key.split('.')[1]]
          : formData[field.key];
        
        const error = field.validation(value);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div 
          className={cn(
            "absolute top-0 right-0 h-full bg-background shadow-2xl pointer-events-auto",
            "transform transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full",
            "border-l border-border overflow-hidden flex flex-col",
            width
          )}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ✅ ATUALIZADO: Passar mode e entity para BaseForm */}
                <BaseForm
                  fields={formFields}
                  data={formData}
                  errors={errors}
                  disabled={isViewMode}
                  onChange={setFormData}
                  mode={mode}
                  entity={entity}
                  groups={groups}
                />
                
                {children}
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 shrink-0">
            <div className="flex flex-col gap-2">
              {!isViewMode && (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center gap-2"
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isCreateMode ? 'Cadastrar' : 'Salvar'}
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="w-full flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {isViewMode ? 'Fechar' : 'Cancelar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}