"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ShippingLocation {
  city: string;
  state: string;
  country: string;
  displayName: string;
}

interface ShippingLocationContextType {
  location: ShippingLocation;
  setLocation: (location: ShippingLocation) => void;
  availableLocations: ShippingLocation[];
}

const defaultLocation: ShippingLocation = {
  city: 'MONTERREY',
  state: 'NL',
  country: 'MX',
  displayName: 'MONTERREY, NL'
};

const availableLocations: ShippingLocation[] = [
  { city: 'MONTERREY', state: 'NL', country: 'MX', displayName: 'MONTERREY, NL' },
  { city: 'CDMX', state: 'CDMX', country: 'MX', displayName: 'CDMX' },
  { city: 'GUADALAJARA', state: 'JAL', country: 'MX', displayName: 'GUADALAJARA, JAL' },
  { city: 'QUERETARO', state: 'QRO', country: 'MX', displayName: 'QUERETARO, QRO' },
  { city: 'PUEBLA', state: 'PUE', country: 'MX', displayName: 'PUEBLA, PUE' },
  { city: 'CANCUN', state: 'QROO', country: 'MX', displayName: 'CANCUN, QROO' },
  { city: 'MERIDA', state: 'YUC', country: 'MX', displayName: 'MERIDA, YUC' },
  { city: 'TIJUANA', state: 'BC', country: 'MX', displayName: 'TIJUANA, BC' },
];

const ShippingLocationContext = createContext<ShippingLocationContextType | undefined>(undefined);

const STORAGE_KEY = 'luzimarket_shipping_location';

export function ShippingLocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<ShippingLocation>(defaultLocation);

  // Load saved location from localStorage on mount
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem(STORAGE_KEY);
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        // Validate the saved location is still in our available locations
        const isValid = availableLocations.some(
          loc => loc.city === parsed.city && loc.state === parsed.state
        );
        if (isValid) {
          setLocationState(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading shipping location:', error);
    }
  }, []);

  const setLocation = (newLocation: ShippingLocation) => {
    setLocationState(newLocation);
    // Save to localStorage for persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));
    } catch (error) {
      console.error('Error saving shipping location:', error);
    }
  };

  return (
    <ShippingLocationContext.Provider value={{ location, setLocation, availableLocations }}>
      {children}
    </ShippingLocationContext.Provider>
  );
}

export function useShippingLocation() {
  const context = useContext(ShippingLocationContext);
  if (!context) {
    throw new Error('useShippingLocation must be used within a ShippingLocationProvider');
  }
  return context;
}