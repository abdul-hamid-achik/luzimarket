import Select from 'react-select';

const SelectCiudadModal = () => {
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
      onChange={(selectedOption) => {
        // TODO: save selected city to form state and update shipping options
      }}
    />
  );
}
export default SelectCiudadModal;