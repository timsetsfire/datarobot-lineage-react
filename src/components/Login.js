import React, { useState }  from 'react';
import '../App.css';

// login and grab use cases
const LoginBox = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Save token and endpoint to sessionStorage
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('endpoint', endpoint);
    // Notify parent that login is complete
    onLogin();
    // console.log(`token ${token}`);
    // console.log(`endpoint ${endpoint}`);
    setIsLoading(true); // Start loading when fetch begins
  };
  return (
    <div className="login-box">
      <h3>API Configuration</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="token">Token</label>
          <input
            type="password"
            id="token"
            value={token}
            placeholder="API Token"
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="endpoint">Endpoint</label>
          <input
            type="text"
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          Grab Use Cases
        </button>
      </form>

      {isLoading && <p>Use Cases are being retrieved...</p>}
    </div>
  );
};

export default LoginBox;