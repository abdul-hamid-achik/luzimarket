import { useState } from 'react';
import { Form, Accordion, Button } from 'react-bootstrap';

/**
 * Filters component for handpicked products
 * Allows filtering by price, category, brand, etc.
 */
const HandpickedFilters = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        priceRange: [0, 5000],
        categories: [],
        brands: []
    });

    // List of available filter categories
    const availableCategories = [
        { id: 1, name: 'Flowershop' },
        { id: 2, name: 'Sweet' },
        { id: 3, name: 'Events + Dinners' }
    ];

    // List of available brands
    const availableBrands = [
        { id: 1, name: 'Brand A' },
        { id: 2, name: 'Brand B' },
        { id: 3, name: 'Brand C' },
        { id: 4, name: 'Brand D' }
    ];

    // Handle price range change
    const handlePriceChange = (e) => {
        const value = parseInt(e.target.value, 10);
        const field = e.target.name;

        setFilters(prev => {
            const newFilters = {
                ...prev,
                priceRange: [...prev.priceRange]
            };

            if (field === 'minPrice') {
                newFilters.priceRange[0] = value;
            } else {
                newFilters.priceRange[1] = value;
            }

            return newFilters;
        });
    };

    // Handle category selection
    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;

        setFilters(prev => {
            let newCategories;
            if (checked) {
                newCategories = [...prev.categories, parseInt(value, 10)];
            } else {
                newCategories = prev.categories.filter(id => id !== parseInt(value, 10));
            }

            return {
                ...prev,
                categories: newCategories
            };
        });
    };

    // Handle brand selection
    const handleBrandChange = (e) => {
        const { value, checked } = e.target;

        setFilters(prev => {
            let newBrands;
            if (checked) {
                newBrands = [...prev.brands, parseInt(value, 10)];
            } else {
                newBrands = prev.brands.filter(id => id !== parseInt(value, 10));
            }

            return {
                ...prev,
                brands: newBrands
            };
        });
    };

    // Apply filters
    const applyFilters = () => {
        // Convert filters to API-friendly format
        const apiFilters = {
            price_gte: filters.priceRange[0],
            price_lte: filters.priceRange[1]
        };

        if (filters.categories.length > 0) {
            apiFilters.categories = filters.categories;
        }

        if (filters.brands.length > 0) {
            apiFilters.brands = filters.brands;
        }

        // Pass filters to parent component
        onFilterChange(apiFilters);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            priceRange: [0, 5000],
            categories: [],
            brands: []
        });
        onFilterChange({});
    };

    return (
        <div className="filter-bar product-filters mb-4">
            <Accordion className="accordion-flush">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Filtrar por precio</Accordion.Header>
                    <Accordion.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Precio mínimo: ${filters.priceRange[0]}</Form.Label>
                            <Form.Range
                                name="minPrice"
                                min={0}
                                max={5000}
                                step={100}
                                value={filters.priceRange[0]}
                                onChange={handlePriceChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Precio máximo: ${filters.priceRange[1]}</Form.Label>
                            <Form.Range
                                name="maxPrice"
                                min={0}
                                max={5000}
                                step={100}
                                value={filters.priceRange[1]}
                                onChange={handlePriceChange}
                            />
                        </Form.Group>
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                    <Accordion.Header>Categorías</Accordion.Header>
                    <Accordion.Body>
                        {availableCategories.map(category => (
                            <Form.Check
                                key={category.id}
                                type="checkbox"
                                id={`category-${category.id}`}
                                label={category.name}
                                value={category.id}
                                checked={filters.categories.includes(category.id)}
                                onChange={handleCategoryChange}
                                className="mb-2"
                            />
                        ))}
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                    <Accordion.Header>Marcas</Accordion.Header>
                    <Accordion.Body>
                        {availableBrands.map(brand => (
                            <Form.Check
                                key={brand.id}
                                type="checkbox"
                                id={`brand-${brand.id}`}
                                label={brand.name}
                                value={brand.id}
                                checked={filters.brands.includes(brand.id)}
                                onChange={handleBrandChange}
                                className="mb-2"
                            />
                        ))}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            <div className="d-flex justify-content-between mt-3">
                <Button variant="outline-secondary" onClick={resetFilters}>
                    Limpiar filtros
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                    Aplicar filtros
                </Button>
            </div>
        </div>
    );
};

export default HandpickedFilters; 