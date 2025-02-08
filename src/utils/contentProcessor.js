import axios from 'axios';

export const processUrl = async (url) => {
  try {
    const response = await axios.get('/api/scrape', {
      params: { url }
    });
    return response.data.content;
  } catch (error) {
    console.error('Failed to process URL:', error);
    throw new Error('Failed to process URL');
  }
};

export const processFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/process-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data.content;
  } catch (error) {
    console.error('Failed to process file:', error);
    throw new Error('Failed to process file');
  }
}; 