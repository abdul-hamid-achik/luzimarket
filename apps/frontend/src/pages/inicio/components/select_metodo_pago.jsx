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
      onChange={(selectedOption) => {
        // TODO: handle payment method selection and trigger checkout updates
      }}
    />
  );
}
export default SelectPagoModal;