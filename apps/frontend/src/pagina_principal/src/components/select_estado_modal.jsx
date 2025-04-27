import React from "react";
import Select from 'react-select';

const SelectCiudadModal = () => {
  const options = [
    { value: 'option1', label: 'Nuevo León' },
    { value: 'option2', label: 'Coahula' },
    { value: 'option3', label: 'Tamaulipas' },
    { value: 'option4', label: 'CDMX' },
    { value: 'option5', label: 'Jalisco' }
  ];

  return (
    <Select
      options={options}
      placeholder="Seleccione un Estado"
      onChange={(selectedOption) => console.log(selectedOption)}
    />
  );
}
export default SelectCiudadModal;