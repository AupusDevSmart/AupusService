import React from 'react';

interface TitleCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function TitleCard({ title, description, children }: TitleCardProps) {
  return (
    // ✅ RESPONSIVO: Margem progressiva e padding lateral em mobile
    <div className="w-full mb-4 sm:mb-6 md:mb-8 px-3 sm:px-0">
      {/* ✅ RESPONSIVO: Título com tamanho progressivo */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
      {description && (
        // ✅ RESPONSIVO: Descrição com tamanho e margem progressivos
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">{description}</p>
      )}
      {children}
    </div>
  );
}