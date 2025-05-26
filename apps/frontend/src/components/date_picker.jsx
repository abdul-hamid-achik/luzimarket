import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

function DateRangePicker({ onDateChange }) {
  const [FechaInicio, setFechaInicio] = useState(null);
  const [FechaFin, setFechaFin] = useState(null);

  const handleDateChange = (Fechas) => {
    const [Inicio, Fin] = Fechas;
    setFechaInicio(Inicio);
    setFechaFin(Fin);
    if (onDateChange) {
      onDateChange(Inicio, Fin);
    }
  };

  const formatDateRange = (Inicio, Fin) => {
    if (!Inicio || !Fin) return "";
    return `${Inicio.toLocaleDateString()} - ${Fin.toLocaleDateString()}`;
  };

  return (
    <div data-testid="date-picker" onClick={() => onDateChange && onDateChange(null, null)}>
      <DatePicker
        selected={FechaInicio}
        onChange={handleDateChange}
        startDate={FechaInicio}
        endDate={FechaFin}
        selectsRange
        dateFormat={"MMM, d, yyyy"}
        customInput={
          <input
            type="text"
            value={formatDateRange(FechaInicio, FechaFin)}
            readOnly
            style={{ width: "200px", padding: "5px", textAlign: "center" }}
          />
        }
      />
    </div>
  );
}

export default DateRangePicker;
