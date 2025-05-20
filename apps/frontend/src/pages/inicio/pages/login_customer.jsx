import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth_context";
import '@/pages/inicio/css/general.css';
import { Spinner, Alert } from 'react-bootstrap';

const LoginCustomer = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // If already authenticated, redirect to the requested page
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // Navigate happens in the useEffect when isAuthenticated changes
    } catch (err) {
      // Show backend error message if available
      if (err && err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
      setIsSubmitting(false);
    }
  };

  // If already authenticated, show a loading spinner while redirecting
  if (isAuthenticated && !isLoading) {
    return <Navigate to={from} replace />;
  }

  // Show loading spinner while checking authentication state
  if (isLoading) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              Logging in...
            </>
          ) : 'Login'}
        </button>
      </form>
      <p className="mt-3">
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginCustomer;