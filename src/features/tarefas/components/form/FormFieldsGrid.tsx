// src/features/tarefas/components/form/FormFieldsGrid.tsx
// Renderiza um conjunto de campos num grid de N colunas, aproveitando melhor o
// espaco do desktop (o grid do BaseForm e fixo em 2 colunas). Os valores sao lidos
// de `formData` e gravados via `onMultipleChange`, usando as mesmas classes
// (select-minimal / input-minimal) dos demais campos do form para manter consistencia.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SubFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'datetime-local';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  showWhen?: (formData: any) => boolean;
}

interface FormFieldsGridProps {
  subFields: SubFieldDef[];
  cols?: 2 | 3 | 4;
  formData?: any;
  onMultipleChange?: (changes: Record<string, any>) => void;
  disabled?: boolean;
}

const colsClass: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function FormFieldsGrid({
  subFields,
  cols = 3,
  formData,
  onMultipleChange,
  disabled,
}: FormFieldsGridProps) {
  const visible = subFields.filter((f) => !f.showWhen || f.showWhen(formData));
  const set = (key: string, value: any) => onMultipleChange?.({ [key]: value });

  return (
    <div className={`grid ${colsClass[cols] || colsClass[3]} gap-x-2 gap-y-4`}>
      {visible.map((f) => {
        const value = formData?.[f.key];
        return (
          <div key={f.key}>
            <label className="text-sm font-medium">
              {f.label}
              {f.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="mt-1">
              {f.type === 'select' ? (
                <Select
                  value={value !== undefined && value !== null && value !== '' ? String(value) : undefined}
                  onValueChange={(v) => set(f.key, v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="select-minimal">
                    <SelectValue placeholder={f.placeholder || `Selecione ${f.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options || []).map((o) => (
                      <SelectItem key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === 'datetime-local' ? (
                <input
                  type="datetime-local"
                  value={value || ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  disabled={disabled}
                  className="input-minimal w-full"
                />
              ) : (
                <input
                  type={f.type}
                  value={value ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  disabled={disabled}
                  placeholder={f.placeholder}
                  min={f.min}
                  max={f.max}
                  className="input-minimal w-full"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
