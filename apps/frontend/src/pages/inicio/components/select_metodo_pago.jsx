import Select from 'react-select';
import { useState, useEffect } from 'react';

const SelectPagoModal = ({ onSelect }) => {
  const options = [
    { value: 'visa-98', label: 'Mi Visa termina en *98' },
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'MasterCard' },
    { value: 'paypal', label: 'Paypal' },
    { value: 'oxxo', label: 'OXXO' }
  ];

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
