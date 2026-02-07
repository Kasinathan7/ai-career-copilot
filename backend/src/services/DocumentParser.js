
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class DocumentParser {
  constructor() {
    this.supportedTypes = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/plain': 'txt'
    };
  }

  /**
   * Parse document and extract text content
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<Object>} Parsed content with metadata
   */
  async parseDocument(filePath, mimeType) {
    try {
      const fileType = this.supportedTypes[mimeType];
      
      if (!fileType) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const fileBuffer = await fs.readFile(filePath);
      let result = {};

      switch (fileType) {
        case 'pdf':
          result = await this.parsePDF(fileBuffer);
          break;
        case 'docx':
          result = await this.parseDOCX(fileBuffer);
          break;
        case 'doc':
          result = await this.parseDOC(fileBuffer);
          break;
        case 'txt':
          result = await this.parseTXT(fileBuffer);
          break;
        default:
          throw new Error(`Parser not implemented for ${fileType}`);
      }

      return {
        success: true,
        content: result.text,
        metadata: {
          fileType,
          pageCount: result.pages || 1,
          wordCount: this.countWords(result.text),
          extractedAt: new Date(),
          ...result.metadata
        }
      };

    } catch (error) {
      console.error('Document parsing error:', error);
      return {
        success: false,
        error: error.message,
        content: null,
        metadata: {
          fileType: this.supportedTypes[mimeType] || 'unknown',
          extractedAt: new Date(),
          parseError: true
        }
      };
    }
  }

  /**
   * Parse PDF document
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async parsePDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      
      return {
        text: this.cleanText(data.text),
        pages: data.numpages,
        metadata: {
          title: data.info?.Title || '',
          author: data.info?.Author || '',
          creator: data.info?.Creator || '',
          producer: data.info?.Producer || '',
          creationDate: data.info?.CreationDate || null,
          modificationDate: data.info?.ModDate || null
        }
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse DOCX document
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX parsing warnings:', result.messages);
      }

      return {
        text: this.cleanText(result.value),
        metadata: {
          warnings: result.messages || []
        }
      };
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse legacy DOC document (limited support)
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async parseDOC(buffer) {
    // Note: Limited support for legacy .doc files
    // For production, consider using LibreOffice or other tools
    try {
      // Attempt basic text extraction
      const text = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r]/g, ' ');
      
      return {
        text: this.cleanText(text),
        metadata: {
          warning: 'Legacy DOC format has limited parsing support'
        }
      };
    } catch (error) {
      throw new Error(`DOC parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse plain text document
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async parseTXT(buffer) {
    try {
      const text = buffer.toString('utf8');
      
      return {
        text: this.cleanText(text),
        metadata: {
          encoding: 'utf8'
        }
      };
    } catch (error) {
      throw new Error(`TXT parsing failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove non-printable characters except newlines
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      // Remove multiple consecutive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Count words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract structured data from resume text using patterns
   * @param {string} text - Parsed resume text
   * @returns {Object} Structured resume data
   */
  extractResumeStructure(text) {
    if (!text) {
      return {
        sections: {},
        contactInfo: {},
        skills: [],
        experience: [],
        education: []
      };
    }

    // Basic pattern matching for common resume sections
    const sections = {};
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Common section headers
    const sectionPatterns = {
      contact: /(contact|personal)/i,
      summary: /(summary|objective|profile)/i,
      experience: /(experience|employment|work|career)/i,
      education: /(education|academic|qualifications)/i,
      skills: /(skills|competencies|technologies)/i,
      certifications: /(certifications|certificates|licenses)/i,
      projects: /(projects|portfolio)/i,
      awards: /(awards|achievements|honors)/i
    };

    // Extract contact information
    const contactInfo = this.extractContactInfo(text);
    
    // Extract skills
    const skills = this.extractSkills(text);
    
    // Extract basic sections
    let currentSection = 'other';
    lines.forEach(line => {
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          currentSection = section;
          sections[section] = sections[section] || [];
          return;
        }
      }
      
      if (sections[currentSection]) {
        sections[currentSection].push(line);
      } else {
        sections[currentSection] = [line];
      }
    });

    return {
      sections,
      contactInfo,
      skills,
      rawText: text,
      wordCount: this.countWords(text)
    };
  }

  /**
   * Extract contact information from text
   * @param {string} text - Resume text
   * @returns {Object} Contact information
   */
  extractContactInfo(text) {
    const contact = {};
    
    // Email pattern
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) contact.email = emailMatch[0];
    
    // Phone pattern
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) contact.phone = phoneMatch[0];
    
    // LinkedIn pattern
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([A-Za-z0-9-]+)/);
    if (linkedinMatch) contact.linkedin = linkedinMatch[0];
    
    // GitHub pattern
    const githubMatch = text.match(/(?:github\.com\/)([A-Za-z0-9-]+)/);
    if (githubMatch) contact.github = githubMatch[0];
    
    return contact;
  }

  /**
   * Extract skills from text using common patterns
   * @param {string} text - Resume text
   * @returns {Array} List of identified skills
   */
  extractSkills(text) {
    const skillPatterns = [
      // Programming languages
      /\b(JavaScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|TypeScript|SQL|HTML|CSS)\b/gi,
      // Frameworks
      /\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|Laravel|Rails)\b/gi,
      // Databases
      /\b(MySQL|PostgreSQL|MongoDB|Redis|SQLite|Oracle|SQL Server)\b/gi,
      // Cloud platforms
      /\b(AWS|Azure|Google Cloud|Docker|Kubernetes|Terraform)\b/gi,
      // Tools
      /\b(Git|GitHub|GitLab|Jenkins|Jira|Slack|Figma|Photoshop)\b/gi
    ];

    const skills = new Set();
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(skill => skills.add(skill));
      }
    });

    return Array.from(skills);
  }

  /**
   * Validate file for parsing
   * @param {string} filePath - Path to file
   * @param {string} mimeType - MIME type
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {Object} Validation result
   */
  async validateFile(filePath, mimeType, maxSize = 10 * 1024 * 1024) { // 10MB default
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > maxSize) {
        return {
          valid: false,
          error: `File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`
        };
      }

      if (!this.supportedTypes[mimeType]) {
        return {
          valid: false,
          error: `Unsupported file type: ${mimeType}. Supported types: ${Object.keys(this.supportedTypes).join(', ')}`
        };
      }

      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error.message}`
      };
    }
  }
}

export default new DocumentParser();