//Componentes Generales
import Navbars from "import../";
import Footer from "import../";

//componentes del carrito
import React from "react";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "import../";
import Checkout from "import../";
import CartTitle from "import../";
import CartItem from "import../";
import "../css/Cart.css";

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
