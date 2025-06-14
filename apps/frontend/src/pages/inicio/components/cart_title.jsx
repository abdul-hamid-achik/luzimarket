const CartTitle = () => {
  const containerStyle = {
    textAlign: 'center',
    padding: '3rem 0 2rem',
    borderBottom: '1px solid #e9ecef',
    marginBottom: '3rem'
  };

  const titleStyle = {
    fontSize: '3.5rem',
    fontWeight: '300',
    color: '#000',
    fontFamily: "'Playfair Display', serif",
    letterSpacing: '-2px',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    fontSize: '1.1rem',
    color: '#666',
    fontWeight: '300',
    letterSpacing: '0.5px'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Tu Carrito</h1>
      <p style={subtitleStyle}>Revisa y confirma tus productos seleccionados</p>
    </div>
  );
};

export default CartTitle;
