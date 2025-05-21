import Select from 'react-select';
import { useEffect, useState } from 'react';
import { useDeliveryZones } from '@/api/hooks';

const SelectCiudadModal = ({ onSelect }) => {
  const { data: zones = [] } = useDeliveryZones();
  const options = zones.map((z) => ({ value: z.id, label: z.name }));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected) {
      sessionStorage.setItem('selectedCity', String(selected.value));
      if (onSelect) onSelect(selected.value);
    }
  }, [selected, onSelect]);

  return (
    <Select
      options={options}
      placeholder="Seleccione una Ciudad"
      value={selected}
      onChange={(option) => setSelected(option)}
    />
  );
};

export default SelectCiudadModal;
