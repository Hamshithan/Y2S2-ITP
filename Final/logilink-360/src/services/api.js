const API_BASE_URL = '/api';

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
  } catch (e) {
    const msg = e?.message === 'Failed to fetch' || e?.name === 'TypeError'
      ? 'Cannot reach the API. Start the backend (port 5000) and keep the Vite dev server proxy enabled.'
      : e.message;
    throw new Error(msg);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      /* use status fallback */
    }
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => fetchAPI('/dashboard/stats'),
  getRecentDeliveries: () => fetchAPI('/dashboard/recent-deliveries'),
  getFleetStatus: () => fetchAPI('/dashboard/fleet-status'),
};

// Drivers API
export const driversAPI = {
  getAll: () => fetchAPI('/drivers'),
  getById: (id) => fetchAPI(`/drivers/${id}`),
  create: (data) => fetchAPI('/drivers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/drivers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/drivers/${id}`, {
    method: 'DELETE',
  }),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: () => fetchAPI('/vehicles'),
  getById: (id) => fetchAPI(`/vehicles/${id}`),
  create: (data) => fetchAPI('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/vehicles/${id}`, {
    method: 'DELETE',
  }),
};

// Parcels API
export const parcelsAPI = {
  getAll: () => fetchAPI('/parcels'),
  getById: (id) => fetchAPI(`/parcels/${id}`),
  create: (data) => fetchAPI('/parcels', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/parcels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/parcels/${id}`, {
    method: 'DELETE',
  }),
};

// Trips/Dispatch API
export const tripsAPI = {
  getAll: () => fetchAPI('/trips'),
  getById: (id) => fetchAPI(`/trips/${id}`),
  create: (data) => fetchAPI('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/trips/${id}`, {
    method: 'DELETE',
  }),
  /** Uber-style driver GPS ping (PATCH /api/trips/:id/location) */
  updateLocation: (id, lat, lng) => fetchAPI(`/trips/${id}/location`, {
    method: 'PATCH',
    body: JSON.stringify({ lat, lng }),
  }),
};

// Routes API
export const routesAPI = {
  getAll: () => fetchAPI('/routes'),
  getById: (id) => fetchAPI(`/routes/${id}`),
  create: (data) => fetchAPI('/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/routes/${id}`, {
    method: 'DELETE',
  }),
};

// Reviews API
export const reviewsAPI = {
  getAll: () => fetchAPI('/reviews'),
  getById: (id) => fetchAPI(`/reviews/${id}`),
  create: (data) => fetchAPI('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/reviews/${id}`, {
    method: 'DELETE',
  }),
  markHelpful: (id) => fetchAPI(`/reviews/${id}/helpful`, {
    method: 'POST',
  }),
};

// Customers/Loyalty API
export const customersAPI = {
  getAll: () => fetchAPI('/customers'),
  getById: (id) => fetchAPI(`/customers/${id}`),
  create: (data) => fetchAPI('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/customers/${id}`, {
    method: 'DELETE',
  }),
  addPurchase: (id, amount) => fetchAPI(`/customers/${id}/purchase`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
};

export default { dashboardAPI, driversAPI, vehiclesAPI, parcelsAPI, tripsAPI, routesAPI, reviewsAPI, customersAPI };
