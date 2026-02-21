import api from './axios';

/**
 * Upload a file to MinIO via the backend.
 * @param {File} file - The file to upload
 * @param {string} folder - One of: 'thumbnails', 'pdfs', 'videos', 'materials'
 * @returns {Promise<{url: string, object_name: string}>}
 */
export async function uploadFile(file, folder = 'materials') {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post(`/uploads/?folder=${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data; // { success, url, object_name }
}
