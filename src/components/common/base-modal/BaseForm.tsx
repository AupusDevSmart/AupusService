// src/components/common/base-modal/BaseForm.tsx - ATUALIZADO
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FormField, FormFieldProps, ModalMode, BaseEntity } from '@/types/base';

interface BaseFormProps {
  fields: FormField[];
  data: any;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (data: any) => void;
  mode?: ModalMode; // ✅ NOVO: Adicionar mode
  entity?: BaseEntity | null; // ✅ NOVO: Adicionar entity
}

export function BaseForm({ 
  fields, 
  data, 
  errors, 
  disabled, 
  onChange, 
  mode, 
  entity 
}: BaseFormProps) {
  const handleFieldChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      onChange({
        ...data,
        [parent]: {
          ...data[parent],
          [child]: value
        }
      });
    } else {
      onChange({
        ...data,
        [key]: value
      });
    }
  };

  const getValue = (key: string) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      return data[parent]?.[child] || '';
    }
    return data[key] || '';
  };

  // Agrupar campos por grupo
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.group || 'main';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);

  const renderField = (field: FormField) => {
    const value = getValue(field.key);
    const error = errors[field.key];
    
    // ✅ ATUALIZADO: Incluir mode e entity no fieldProps
    const fieldProps: FormFieldProps = {
      value,
      onChange: (newValue) => handleFieldChange(field.key, newValue),
      disabled,
      error,
      mode, // ✅ NOVO: Passar mode
      entity, // ✅ NOVO: Passar entity
    };

    if (field.render) {
      return field.render(fieldProps);
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={disabled}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={disabled}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([groupName, groupFields], groupIndex) => (
        <div key={groupName}>
          {groupIndex > 0 && <Separator />}
          
          {groupName !== 'main' && (
            <h3 className="text-base font-semibold border-b pb-2 capitalize">
              {groupName.replace(/_/g, ' ')}
            </h3>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            {groupFields.map((field) => (
              <div key={field.key} className={`col-span-${field.colSpan || 1}`}>
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="mt-1">
                  {renderField(field)}
                </div>
                {errors[field.key] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}