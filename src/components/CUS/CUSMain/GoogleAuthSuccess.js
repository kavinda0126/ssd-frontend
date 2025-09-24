import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CusAuthContext } from '../../../context/cus-authcontext';
import { Container, Card, Spinner } from 'react-bootstrap';

function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const cusauth = useContext(CusAuthContext);

  useEffect(() => {
    // Parse query parameters from the URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const email = params.get('email');
    const name = params.get('name');

    if (token && userId && email && name) {
      // Login the user using the context
      cusauth.login(userId, email, name, token);
      
      // Redirect to customer home page after a short delay
      setTimeout(() => {
        navigate('/customer');
      }, 2000);
    } else {
      // If parameters are missing, redirect to login page
      navigate('/customer/cuslogin');
    }
  }, [cusauth, location.search, navigate]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <Card className="text-center p-5" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <h2>Google Authentication Successful</h2>
          <p>You are being redirected to the dashboard...</p>
          <Spinner animation="border" variant="success" />
        </Card.Body>
      </Card>
    </Container>
  );
}

export default GoogleAuthSuccess;