import React from 'react';
import { render } from '@testing-library/react';
import MapView from '@/components/map_view';

describe('MapView', () => {
    it('renders a leaflet container', () => {
        const { container } = render(<MapView />);
        const mapDiv = container.querySelector('.leaflet-container');
        expect(mapDiv).toBeInTheDocument();
    });
}); 