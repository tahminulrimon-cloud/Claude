const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(BASE + url, options)
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`)
  return res.json()
}

export const api = {
  getCountries: () => request('/countries'),
  getCountry: (id) => request(`/countries/${id}`),

  getAlbums: (countryId) => request(`/albums?countryId=${countryId}`),
  createAlbum: (data) => request('/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteAlbum: (id) => request(`/albums/${id}`, { method: 'DELETE' }),

  getPhotos: (albumId) => request(`/photos?albumId=${albumId}`),
  uploadPhotos: (formData) => request('/photos', { method: 'POST', body: formData }),
  updatePhoto: (id, data) => request(`/photos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),

  photoUrl: (filename) => `/uploads/${filename}`,
}
