import { IconContext } from "react-icons";

const OrderStatus = ({ icon, orderCount, title, status }) => {
  return (
    <div className="containerComponentStatus">
      <div className="iconOrderStatus">
        <IconContext.Provider value={{ size: "100%" }}>
          {icon}
        </IconContext.Provider>
      </div>
      <div className="textOrderStatus">
        <div className="OrderCountOrderStatus">
          {orderCount} {title}
        </div>
        <div className="StatusOrderStatus">{status}</div>
      </div>
    </div>
  );
};

export default OrderStatus;
