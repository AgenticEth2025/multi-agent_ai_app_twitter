import express from 'express';
import axios from 'axios';
import multer from 'multer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const pdfExtract = new PDFExtract();
const extractPdfText = async (buffer) => {
  try {
    const data = await pdfExtract.extractBuffer(buffer);
    return data.pages
      .map(page => page.content.map(item => item.str).join(' '))
      .join('\n');
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Helper to extract text from HTML
const extractTextFromHtml = (html) => {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article ? article.textContent : '';
};

// URL scraping endpoint
router.get('/scrape', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Scraping content from URL: ${url}`);
    const response = await axios.get(url);
    const content = extractTextFromHtml(response.data);
    
    console.log(`Successfully scraped content (${content.length} characters)`);
    res.json({ content });
  } catch (error) {
    console.error('URL scraping failed:', error);
    res.status(500).json({ 
      error: 'Failed to scrape URL',
      details: error.message 
    });
  }
});

// File processing endpoint
router.post('/process-file', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { path: filePath, mimetype } = req.file;
  console.log(`Processing file: ${req.file.originalname} (${mimetype})`);

  try {
    // Verify file exists before processing
    if (!fs.existsSync(filePath)) {
      throw new Error(`Upload failed: File not found at ${filePath}`);
    }

    let content = '';

    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      content = await extractPdfText(dataBuffer);
    } 
    else if (mimetype.includes('word') || mimetype.includes('docx')) {
      const result = await mammoth.extractRawText({ path: filePath });
      content = result.value;
    }
    else if (mimetype === 'text/plain') {
      content = fs.readFileSync(filePath, 'utf8');
    }
    else {
      throw new Error('Unsupported file type');
    }

    // Cleanup uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
      // Continue anyway since we have the content
    }

    console.log(`Successfully processed file (${content.length} characters)`);
    res.json({ content });
  } catch (error) {
    console.error('File processing failed:', error);
    // Cleanup on error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file after error:', cleanupError);
      }
    }
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message 
    });
  }
});

export default router; 