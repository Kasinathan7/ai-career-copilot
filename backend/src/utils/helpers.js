import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the directory name of the current module
export const getDirname = (importMetaUrl) => {
  return dirname(fileURLToPath(importMetaUrl));
};

// Format error messages
export const formatError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return {
      type: 'validation',
      message: 'Validation failed',
      errors
    };
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return {
      type: 'duplicate',
      message: `${field} '${value}' already exists`,
      field,
      value
    };
  }

  if (error.name === 'CastError') {
    return {
      type: 'cast',
      message: `Invalid ${error.path}: ${error.value}`,
      field: error.path,
      value: error.value
    };
  }

  return {
    type: 'unknown',
    message: error.message || 'An unknown error occurred',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

// Generate random string
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Sanitize HTML content
export const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Parse pagination parameters
export const parsePagination = (query, defaults = {}) => {
  const page = parseInt(query.page) || defaults.page || 1;
  const limit = parseInt(query.limit) || defaults.limit || 20;
  const skip = (page - 1) * limit;

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)), // Cap at 100 items per page
    skip: Math.max(0, skip)
  };
};

// Create success response
export const createSuccessResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta
  };
};

// Create error response
export const createErrorResponse = (message = 'An error occurred', details = null) => {
  const response = {
    success: false,
    message
  };

  if (details) {
    response.details = details;
  }

  return response;
};

// Sleep utility function
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Calculate similarity between two strings
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  const editDistance = calculateEditDistance(longer, shorter);
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - editDistance) / longer.length;
};

// Calculate edit distance between two strings
const calculateEditDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Merge objects deeply
export const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

// Check if value is object
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate slug from string
export const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert camelCase to Title Case
export const camelToTitle = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default {
  getDirname,
  formatError,
  generateRandomString,
  sanitizeHtml,
  isValidEmail,
  parsePagination,
  createSuccessResponse,
  createErrorResponse,
  sleep,
  retryWithBackoff,
  calculateSimilarity,
  deepClone,
  deepMerge,
  formatFileSize,
  generateSlug,
  capitalize,
  camelToTitle
};