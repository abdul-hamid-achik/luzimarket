import Select from 'react-select';
import { useState, useEffect } from 'react';
import { usePaymentMethods } from '@/api/hooks';

const SelectPagoModal = ({ onSelect }) => {
  const { data: methods = [] } = usePaymentMethods();
  const options = methods.map((m) => ({ value: m.id, label: m.label }));

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected) {
      sessionStorage.setItem('paymentMethod', selected.value);
      if (onSelect) onSelect(selected.value);
    }
  }, [selected, onSelect]);

  return (
    <Select
      options={options}
      placeholder="Seleccione un metodo de Pago"
      value={selected}
      onChange={(option) => setSelected(option)}
    />
  );
};

export default SelectPagoModal;
