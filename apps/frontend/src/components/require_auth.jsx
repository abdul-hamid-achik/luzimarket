import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from "@/context/auth_context";
import { useContext } from "react";

const RequireAuth = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

export default RequireAuth;