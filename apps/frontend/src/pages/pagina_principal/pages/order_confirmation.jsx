import { useParams, Link } from 'react-router-dom';
import { useOrder } from "@/api/hooks";
import '@/pages/pagina_principal/css/general.css';

const OrderConfirmation = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useOrder(id);
  if (isLoading) return <div>Loading order...</div>;
  if (error) return <div>Error loading order.</div>;
  const { order, items } = data;
  return (
    <div className="container mt-5">
      <h2>Order Confirmation</h2>
      <p>Order ID: {order.id}</p>
      <p>Status: {order.status}</p>
      <p>Total: ${Number(order.total).toFixed(2)}</p>
      <h4 className="mt-4">Items:</h4>
      <ul className="list-group">
        {items.map((item) => (
          <li key={item.id} className="list-group-item d-flex justify-content-between">
            <span>{item.productId} x {item.quantity}</span>
            <span>${Number(item.price).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <Link to="/" className="btn btn-dark mt-4">Return to Home</Link>
    </div>
  );
};

export default OrderConfirmation;