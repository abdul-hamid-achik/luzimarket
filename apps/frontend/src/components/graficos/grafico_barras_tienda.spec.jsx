import React from 'react';
import { render } from '@testing-library/react';
import Example from '@/components/graficos/grafico_barras_tienda';

describe('GraficoBarrasTienda', () => {
    it('renders a bar chart with an SVG element', () => {
        const { container } = render(<Example />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
}); 