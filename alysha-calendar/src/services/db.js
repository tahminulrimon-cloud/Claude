const DB_NAME = 'TravelPhotoGallery';
const DB_VERSION = 1;

let db = null;

export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains('countries')) {
        const countryStore = database.createObjectStore('countries', { keyPath: 'id' });
        countryStore.createIndex('name', 'name', { unique: false });
      }

      if (!database.objectStoreNames.contains('albums')) {
        const albumStore = database.createObjectStore('albums', { keyPath: 'id' });
        albumStore.createIndex('countryId', 'countryId', { unique: false });
      }

      if (!database.objectStoreNames.contains('photos')) {
        database.createObjectStore('photos', { keyPath: 'id' });
      }
    };
  });
}

export async function addCountry(countryData) {
  const tx = db.transaction('countries', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('countries').add({
      id: Date.now().toString(),
      ...countryData,
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCountries() {
  const tx = db.transaction('countries', 'readonly');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('countries').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCountryById(id) {
  const tx = db.transaction('countries', 'readonly');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('countries').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addAlbum(albumData) {
  const tx = db.transaction('albums', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('albums').add({
      id: Date.now().toString(),
      ...albumData,
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAlbumsByCountry(countryId) {
  const tx = db.transaction('albums', 'readonly');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('albums').index('countryId').getAll(countryId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAlbumById(id) {
  const tx = db.transaction('albums', 'readonly');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('albums').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPhoto(photoData) {
  const tx = db.transaction('photos', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('photos').add({
      id: Date.now().toString() + Math.random(),
      ...photoData,
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPhotosByAlbum(albumId) {
  const tx = db.transaction('photos', 'readonly');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('photos').getAll();
    request.onsuccess = () => {
      const allPhotos = request.result;
      const filtered = allPhotos.filter(photo => photo.albumId === albumId);
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deletePhoto(photoId) {
  const tx = db.transaction('photos', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('photos').delete(photoId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAlbum(albumId) {
  const tx = db.transaction('albums', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = tx.objectStore('albums').delete(albumId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
