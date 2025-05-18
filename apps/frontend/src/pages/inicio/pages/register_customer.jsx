import { useNavigate, Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from "@/context/auth_context";
import '@/pages/inicio/css/general.css';

const RegisterCustomer = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const regResult = await register({ email, password });
      console.log('Register result:', regResult);
      // After auto-login, redirect to home or profile
      navigate('/', { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== '/') {
          setError('Did not redirect to home after registration. Current URL: ' + window.location.pathname);
        }
      }, 2000);
    } catch (err) {
      // Show backend error message if available
      console.error('Registration error:', err);
      if (err && err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>Register</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-dark">
          Register
        </button>
      </form>
      <p className="mt-3">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterCustomer;