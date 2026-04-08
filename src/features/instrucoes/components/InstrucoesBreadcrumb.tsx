// src/features/instrucoes/components/InstrucoesBreadcrumb.tsx
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function InstrucoesBreadcrumb() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 mb-4 text-sm">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </button>
      <span className="text-gray-400">/</span>
      <span className="text-gray-600 dark:text-gray-400">Instruções</span>
    </div>
  );
}
