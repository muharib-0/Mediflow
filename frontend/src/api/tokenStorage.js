const ACCESS_KEY = 'mediflow_access_token';
const REFRESH_KEY = 'mediflow_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}



export async function fetchWithAuth(url, options = {}) {
  // 1. Get the token using your exact function
  const token = getAccessToken(); 
  
  // 2. Set up the headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 3. Attach the token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}