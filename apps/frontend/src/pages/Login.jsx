import { Link } from "react-router-dom";
import "../css/Login.css";
import LuziLogoAdmin from "../images/luzimarket-logo.png";
import { useState } from "react";
import Inicio from "../layout/Inicio";

const Login = () => {
  const [miLogin, setLogin] = useState("false");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  function iniciarSesion(e) {
    e.preventDefault();
    var txtUsusario = document.getElementById("txtUser").value();
    var txtPassword = document.getElementById("txtPass").value();

    if (txtUsusario.lenght === 0 || txtPassword.lenght === 0) {
      alert("Complete el datos para iniciar sesion");
    } else {
      if (usuario == "admin" && password == "admin") {
        setLogin("true");
        document.getElementById("Login").style.display = "none";
      } else {
        setLogin("false");
        alert("El Usuario y/o contraseña no son los correctos");
        document.getElementById("txtUser").value = "";
        document.getElementById("txtPass").value = "";
        document.getElementById("txtUser").focus();
      }
    }
  }
  return (
    <>
      <div className="App" id="Login">
        <img src={LuziLogoAdmin} className="logo-admin" />
        <header className="App-header">
          <div className="App-login">
            <h1 className="titulo__login">Bienvenidx</h1>
            <input
              className="caja__texto__login"
              type="text"
              placeholder="Email"
              id="txtUser"
            />
            <input
              className="caja__texto__login"
              type="password"
              placeholder="Password"
              id="txtPass"
            />
            <Link to="/inicio/dashboard" className="button">
              Entrar
            </Link>
          </div>
        </header>
      </div>

      {miLogin === "true" && <Inicio />}
    </>
  );
};
export default Login;
