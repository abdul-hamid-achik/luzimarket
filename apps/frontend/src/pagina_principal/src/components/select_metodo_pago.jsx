import { image } from "@nextui-org/theme";
import React from "react";
import Select from 'react-select';

const SelectPagoModal = () => {
  const options = [
    { value: 'option1', label: 'Mi Visa termina en *98' },
    { value: 'option2', label: 'Visa' },
    { value: 'option3', label: 'MasterCard' },
    { value: 'option4', label: 'Paypal' },
    { value: 'option5', label: 'OXXO' }
  ];

  return (
    <Select
      options={options}
      placeholder="Seleccione un metodo de Pago"
      onChange={(selectedOption) => console.log(selectedOption)}
    />
  );
}
export default SelectPagoModal;