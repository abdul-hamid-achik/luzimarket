//Componentes Generales
import Navbars from "@/pagina_principal/src/components/navbars/navbar_principal";
import Footer from "@/pagina_principal/src/components/footer";

//componentes del carrito
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/api/hooks";
import Checkout from "@/pagina_principal/src/components/cart_checkout";
import CartTitle from "@/pagina_principal/src/components/cart_title";
import CartItem from "@/pagina_principal/src/components/cart_item";
import "@/pagina_principal/src/css/cart.css";

const Cart = () => {
  const { data, isLoading, error } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (isLoading) return <div>Loading cart...</div>;
  if (error) return <div>Error loading cart.</div>;

  const { items } = data;

  const handleRemoveItem = (id) => {
    removeItem.mutate(id);
  };

  const handleQuantityChange = (id, quantity) => {
    updateItem.mutate({ itemId: id, quantity });
  };

  return (
    <>
      <Navbars />
      <div className="container" style={{ marginBottom: '7%' }}>
        <CartTitle />
        <div className="hstack gap-3">
          <div className="container">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={() => handleRemoveItem(item.id)}
                onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
              />
            ))}
          </div>
          <div className="vr"></div>
          <Checkout cartItems={items} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
