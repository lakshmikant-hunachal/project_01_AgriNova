const API_URL = 'http://localhost:3000/api';

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Registration failed');
  return data;
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
};

export const getUserProfile = async (email) => {
  const response = await fetch(`${API_URL}/user/profile?email=${email}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
  return data;
};

export const getUserScans = async (email) => {
  const response = await fetch(`${API_URL}/user/scans?email=${email}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch scans');
  return data;
};

export const saveScan = async (scanData) => {
  const response = await fetch(`${API_URL}/user/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scanData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to save scan');
  return data;
};
