import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils';

/**
 * Teste de fumaca da infra: exercita happy-dom, RTL, os matchers do jest-dom e
 * os dois providers de uma vez. Se este quebrar, o problema e do setup de
 * teste, nao de nenhuma feature.
 */
describe('renderWithProviders', () => {
  it('monta o componente com QueryClient e Router sem estourar', () => {
    renderWithProviders(<span>infra de teste no ar</span>);

    expect(screen.getByText('infra de teste no ar')).toBeInTheDocument();
  });
});
