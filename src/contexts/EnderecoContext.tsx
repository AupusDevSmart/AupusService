// src/contexts/EnderecoContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EnderecoContextType {
  selectedUF: string;
  setSelectedUF: (uf: string) => void;
  selectedCidade: string;
  setSelectedCidade: (cidade: string) => void;
}

const EnderecoContext = createContext<EnderecoContextType | undefined>(undefined);

export const useEnderecoContext = () => {
  const context = useContext(EnderecoContext);
  if (!context) {
    throw new Error('useEnderecoContext deve ser usado dentro de EnderecoProvider');
  }
  return context;
};

interface EnderecoProviderProps {
  children: ReactNode;
  initialUF?: string;
  initialCidade?: string;
}

export const EnderecoProvider: React.FC<EnderecoProviderProps> = ({ 
  children, 
  initialUF = '', 
  initialCidade = '' 
}) => {
  const [selectedUF, setSelectedUF] = useState(initialUF);
  const [selectedCidade, setSelectedCidade] = useState(initialCidade);

  return (
    <EnderecoContext.Provider 
      value={{
        selectedUF,
        setSelectedUF,
        selectedCidade,
        setSelectedCidade
      }}
    >
      {children}
    </EnderecoContext.Provider>
  );
};