import React, {useState} from "react";
import Select from 'react-select';
import {states} from "import../";

const SelectCiudadModal  = ( ) => { 
  const options = [
    { value: 'option1', label: 'Monterrey' },
    { value: 'option2', label: 'Torreón' },
    { value: 'option3', label: 'Matamoros' },
    { value: 'option4', label: 'CDMX' },
    { value: 'option5', label: 'Guadalajara' }
  ];

  return (
    <Select
        options={options}
        placeholder="Seleccione una Ciudad"
        onChange={(selectedOption) => console.log(selectedOption)}
      />
  );
}
export default SelectCiudadModal;