export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error.response?.data;

  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  if (data && typeof data === 'object') {
    const [field, messages] = Object.entries(data)[0] ?? [];
    if (Array.isArray(messages)) return `${field}: ${messages.join(' ')}`;
    if (typeof messages === 'string') return `${field}: ${messages}`;
  }

  return fallback;
}

export function unwrapResults(data) {
  return Array.isArray(data) ? data : data?.results ?? [];
}
