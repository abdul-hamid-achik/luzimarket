// Mock orders for employees panel
export interface AdminOrder {
  id: number;
  total: number;
  cliente: string;
  estadoPago: string;
  estadoOrden: string;
  tipoEnvio: string;
  fecha: string;
}

export const AdminOrders: AdminOrder[] = [
  {
    id: 2453,
    total: 87,
    cliente: "Carry Anna",
    estadoPago: "Completo",
    estadoOrden: "Cancelado",
    tipoEnvio: "Pago al Entregar",
    fecha: "Dic 12, 12:56 PM",
  },
  {
    id: 2452,
    total: 7264,
    cliente: "Milind Mikuja",
    estadoPago: "Cancelado",
    estadoOrden: "Listo para recoger",
    tipoEnvio: "Envio Gratis",
    fecha: "Dic 09, 2:28 PM",
  },
  {
    id: 2451,
    total: 375,
    cliente: "Stanly Drinkwater",
    estadoPago: "Pendiente",
    estadoOrden: "Completado",
    tipoEnvio: "Entrega Local",
    fecha: "Dic 04, 12:56 PM",
  },
  {
    id: 2450,
    total: 657,
    cliente: "Josef Stravinsky",
    estadoPago: "Cancelado",
    estadoOrden: "Parcialmente Ordenado",
    tipoEnvio: "Envio Estandard",
    fecha: "Dic 1, 04:07 PM",
  },
  {
    id: 2449,
    total: 9562,
    cliente: "Igor Borvibson",
    estadoPago: "Fallido",
    estadoOrden: "Parcialmente Ordenado",
    tipoEnvio: "Envio Express",
    fecha: "Nov 28, 7:28 PM",
  },
  {
    id: 2448,
    total: 46,
    cliente: "Katerina Karenin",
    estadoPago: "Pagado",
    estadoOrden: "Sin Ordenar",
    tipoEnvio: "Envio Local",
    fecha: "Nov 24, 10:15 AM",
  },
  {
    id: 2447,
    total: 953,
    cliente: "Roy Anderson",
    estadoPago: "Pendiente",
    estadoOrden: "Ordenado",
    tipoEnvio: "Pago al entregar",
    fecha: "Nov 18, 5:43 PM",
  },
];