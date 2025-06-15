"use client";

import { useState } from "react";
import { Package, CheckCircle, Truck, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
  statusColors: Record<string, string>;
  onStatusChange: (orderId: string, status: string) => Promise<void>;
}

export function OrderStatusSelect({ 
  orderId, 
  currentStatus, 
  statusColors, 
  onStatusChange 
}: OrderStatusSelectProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const statusIcons: Record<string, any> = {
    pending: Package,
    paid: CheckCircle,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: XCircle,
  };
  
  const StatusIcon = statusIcons[currentStatus];

  const handleValueChange = async (value: string) => {
    setIsLoading(true);
    try {
      await onStatusChange(orderId, value);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Select 
      defaultValue={currentStatus}
      onValueChange={handleValueChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-32">
        <SelectValue>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers ${statusColors[currentStatus]}`}>
            {StatusIcon && <StatusIcon className="mr-1.5 h-3 w-3" />}
            {getStatusText(currentStatus)}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pendiente</SelectItem>
        <SelectItem value="paid">Pagado</SelectItem>
        <SelectItem value="shipped">Enviado</SelectItem>
        <SelectItem value="delivered">Entregado</SelectItem>
        <SelectItem value="cancelled">Cancelado</SelectItem>
      </SelectContent>
    </Select>
  );
}