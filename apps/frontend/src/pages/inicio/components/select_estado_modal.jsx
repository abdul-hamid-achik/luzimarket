import Select from 'react-select';
import { useEffect, useState } from 'react';
import { useStates } from '@/api/hooks';

const SelectEstadoModal = ({ onSelect }) => {
  const { data: states = [] } = useStates();
  const options = states.map((s) => ({ value: s.value, label: s.label }));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected) {
      sessionStorage.setItem('selectedState', selected.value);
      if (onSelect) onSelect(selected.value);
    }
  }, [selected, onSelect]);

  return (
    <Select
      options={options}
      placeholder="Seleccione un Estado"
      value={selected}
      onChange={(option) => setSelected(option)}
    />
  );
};

export default SelectEstadoModal;
