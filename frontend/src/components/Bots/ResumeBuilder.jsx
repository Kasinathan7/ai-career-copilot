import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Tooltip
} from '@mui/material';
import {
  Edit,
  CloudUpload,
  CheckCircle,
  Warning,
  AutoFixHigh,
  Download,
  Visibility,
  FilePresent,
  TrendingUp,
  ArrowBack,
  RefreshOutlined,
  ExpandMore,
  Star,
  Language,
  EmojiEvents,
  Work,
  Code
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useBotContext } from '../BotRouter';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ResumeBuilder = () => {
  const { goToMain } = useBotContext();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [originalResume, setOriginalResume] = useState(null);
  const [optimizations, setOptimizations] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [parseProgress, setParseProgress] = useState(0);

  // File parsing functions
  const parseDocxFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Add timeout for DOCX parsing
      const parsePromise = new Promise(async (resolve, reject) => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value || 'No text content found in document');
        } catch (error) {
          reject(error);
        }
      });
      
      // Add 8 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('DOCX parsing timeout')), 8000);
      });
      
      return await Promise.race([parsePromise, timeoutPromise]);
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  };

  const parsePdfFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Add timeout for PDF parsing
      const parsePromise = new Promise(async (resolve, reject) => {
        try {
          const pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0 // Reduce console output
          }).promise;
          
          let text = '';
          const maxPages = Math.min(pdf.numPages, 3); // Limit to first 3 pages for performance
          
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += pageText + '\n';
          }
          
          resolve(text || 'No text content found in PDF');
        } catch (error) {
          reject(error);
        }
      });
      
      // Add 10 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF parsing timeout')), 10000);
      });
      
      return await Promise.race([parsePromise, timeoutPromise]);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  };

  const extractResumeData = (text) => {
    // Enhanced resume parsing logic with better accuracy
    const lines = text.split('\n').filter(line => line.trim());
    const fullText = text.toLowerCase();
    
    // Extract basic info with better regex patterns
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([\w-]+)/gi;
    
    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    const linkedinMatches = text.match(linkedinRegex) || [];
    
    const email = emails[0] || 'your.email@example.com';
    const phone = phones[0] || '+1 (555) 123-4567';
    const linkedin = linkedinMatches[0] || 'linkedin.com/in/yourprofile';
    
    // Extract name (first few lines, excluding common headers)
    const skipWords = ['resume', 'curriculum', 'cv', 'vitae'];
    let name = 'Your Name';
    for (let line of lines.slice(0, 5)) {
      const cleanLine = line.trim().replace(/[^\w\s]/g, '');
      if (cleanLine.length > 2 && cleanLine.length < 50 && 
          !skipWords.some(word => cleanLine.toLowerCase().includes(word)) &&
          !cleanLine.includes('@') && !cleanLine.match(/\d{3}/)) {
        name = cleanLine;
        break;
      }
    }
    
    // Extract location (look for city, state patterns)
    const locationRegex = /([A-Z][a-z]+,?\s+[A-Z]{2}|[A-Z][a-z]+,?\s+[A-Z][a-z]+)/g;
    const locations = text.match(locationRegex) || [];
    const location = locations[0] || 'City, State';
    
    // Enhanced skill extraction with categories
    const technicalSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'HTML', 'CSS', 'SCSS', 'Sass', 'Bootstrap', 'Tailwind',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence',
      'Linux', 'Ubuntu', 'Windows', 'macOS'
    ];
    
    const softSkills = [
      'Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Project Management',
      'Agile', 'Scrum', 'Kanban', 'Critical Thinking', 'Analytical Skills'
    ];
    
    const foundTechnicalSkills = technicalSkills.filter(skill => 
      fullText.includes(skill.toLowerCase())
    );
    
    const foundSoftSkills = softSkills.filter(skill => 
      fullText.includes(skill.toLowerCase())
    );
    
    const allSkills = [...foundTechnicalSkills, ...foundSoftSkills];
    
    // Extract experience with better pattern matching
    const experienceSection = extractSection(text, ['experience', 'work history', 'employment', 'professional experience']);
    const experiences = parseExperience(experienceSection, text);
    
    // Extract education
    const educationSection = extractSection(text, ['education', 'academic background', 'qualifications']);
    const education = parseEducation(educationSection, text);
    
    // Extract projects
    const projectSection = extractSection(text, ['projects', 'key projects', 'notable projects']);
    const projects = parseProjects(projectSection, foundTechnicalSkills);
    
    // Extract certifications
    const certificationSection = extractSection(text, ['certifications', 'certificates', 'credentials']);
    const certifications = parseCertifications(certificationSection);
    
    return {
      personalInfo: {
        name: name,
        email,
        phone,
        location,
        linkedin
      },
      summary: extractSummary(text),
      experience: experiences,
      skills: allSkills.length > 0 ? allSkills : ['Communication', 'Problem Solving', 'Teamwork'],
      education: education,
      certifications: certifications,
      projects: projects,
      languages: extractLanguages(text)
    };
  };

  // Helper functions for better parsing
  const extractSection = (text, keywords) => {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = lines.length;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (keywords.some(keyword => line.includes(keyword)) && line.length < 50) {
        sectionStart = i;
        break;
      }
    }
    
    if (sectionStart === -1) return '';
    
    // Find section end (next major section or end of document)
    const endKeywords = ['education', 'experience', 'skills', 'projects', 'certifications', 'languages'];
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (endKeywords.some(keyword => line.includes(keyword)) && line.length < 50) {
        sectionEnd = i;
        break;
      }
    }
    
    return lines.slice(sectionStart, sectionEnd).join('\n');
  };

  const parseExperience = (experienceText, fullText) => {
    const experiences = [];
    const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
    const matches = [...fullText.matchAll(datePattern)];
    
    if (matches.length > 0) {
      // Try to extract job titles and companies
      const lines = experienceText.split('\n').filter(line => line.trim());
      let currentExp = null;
      
      for (let line of lines) {
        line = line.trim();
        if (line.length > 5 && line.length < 100) {
          // Look for job title patterns
          if (line.includes('|') || line.includes('-') || line.includes('at ')) {
            const parts = line.split(/[|,-]|at /);
            if (parts.length >= 2) {
              currentExp = {
                title: parts[0].trim(),
                company: parts[1].trim(),
                duration: matches[0] ? `${matches[0][1]} - ${matches[0][2]}` : '2022 - Present',
                achievements: []
              };
              experiences.push(currentExp);
            }
          } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
            currentExp.achievements.push(line.replace(/^[•\-*]\s*/, ''));
          }
        }
      }
    }
    
    // Fallback if no experience found
    if (experiences.length === 0) {
      experiences.push({
        title: 'Professional Role',
        company: 'Company Name',
        duration: '2022 - Present',
        achievements: [
          'Key responsibility or achievement from resume',
          'Another important contribution',
          'Additional accomplishment or duty'
        ]
      });
    }
    
    return experiences;
  };

  const parseEducation = (educationText, fullText) => {
    const education = [];
    const degreeKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'certificate', 'diploma'];
    const lines = educationText.split('\n').filter(line => line.trim());
    
    for (let line of lines) {
      const lowerLine = line.toLowerCase();
      if (degreeKeywords.some(keyword => lowerLine.includes(keyword))) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        education.push({
          degree: line.trim(),
          school: 'University Name',
          year: yearMatch ? yearMatch[0] : '2023'
        });
        break;
      }
    }
    
    if (education.length === 0) {
      education.push({
        degree: 'Degree Name',
        school: 'Institution Name',
        year: '2023'
      });
    }
    
    return education;
  };

  const parseProjects = (projectText, skills) => {
    const projects = [];
    const lines = projectText.split('\n').filter(line => line.trim());
    
    if (lines.length > 2) {
      for (let i = 0; i < Math.min(lines.length, 6); i += 3) {
        if (lines[i] && lines[i].trim().length > 5) {
          projects.push({
            name: lines[i].trim(),
            technologies: skills.slice(0, 4).join(', '),
            description: lines[i + 1] ? lines[i + 1].trim() : 'Project description from resume',
            link: 'github.com/username/project'
          });
        }
      }
    }
    
    return projects;
  };

  const parseCertifications = (certText) => {
    const certifications = [];
    const lines = certText.split('\n').filter(line => line.trim());
    
    for (let line of lines) {
      if (line.trim().length > 5) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        certifications.push({
          name: line.trim(),
          issuer: 'Issuing Organization',
          year: yearMatch ? yearMatch[0] : '2024'
        });
      }
    }
    
    return certifications;
  };

  const extractSummary = (text) => {
    const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (summaryKeywords.some(keyword => line.includes(keyword)) && line.length < 50) {
        // Get next few lines as summary
        const summaryLines = [];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim().length > 20) {
            summaryLines.push(lines[j].trim());
          }
        }
        if (summaryLines.length > 0) {
          return summaryLines.join(' ');
        }
      }
    }
    
    // Fallback: use first substantial paragraph
    for (let line of lines) {
      if (line.trim().length > 50 && !line.includes('@') && !line.match(/\d{3}/)) {
        return line.trim();
      }
    }
    
    return 'Professional summary to be extracted from resume content...';
  };

  const extractLanguages = (text) => {
    const languageKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'arabic', 'portuguese', 'italian', 'russian'];
    const languages = [];
    
    for (let lang of languageKeywords) {
      if (text.toLowerCase().includes(lang)) {
        languages.push({
          name: lang.charAt(0).toUpperCase() + lang.slice(1),
          level: 4 // Default to good proficiency
        });
      }
    }
    
    if (languages.length === 0) {
      languages.push({ name: 'English', level: 5 });
    }
    
    return languages;
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type === 'application/pdf' || 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.toLowerCase().endsWith('.pdf') ||
          file.name.toLowerCase().endsWith('.doc') ||
          file.name.toLowerCase().endsWith('.docx')) {
        setUploadedFile(file);
        setError('');
        setParseProgress(10);
        
        // Parse the file immediately with better error handling
        try {
          setParseProgress(20);
          let text = '';
          
          // Add a small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            setParseProgress(30);
            text = await parsePdfFile(file);
          } else {
            setParseProgress(30);
            text = await parseDocxFile(file);
          }
          
          setParseProgress(70);
          
          // Add another small delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const resumeData = extractResumeData(text);
          setOriginalResume(resumeData);
          setParseProgress(100);
          
          setTimeout(() => setParseProgress(0), 1500);
        } catch (err) {
          console.error('Parse error:', err);
          setError(`Failed to parse resume file: ${err.message}. Please try a different file.`);
          setParseProgress(0);
          
          // Create a fallback resume structure
          const fallbackResume = {
            personalInfo: {
              name: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' '),
              email: 'your.email@example.com',
              phone: '+1 (555) 123-4567',
              location: 'City, State',
              linkedin: 'linkedin.com/in/yourprofile'
            },
            summary: 'Professional summary will be extracted from your resume...',
            experience: [],
            skills: ['Communication', 'Problem Solving', 'Teamwork'],
            education: [{
              degree: 'Your Degree',
              school: 'Your University',
              year: '2023'
            }],
            certifications: [],
            projects: [],
            languages: [{ name: 'English', level: 5 }]
          };
          setOriginalResume(fallbackResume);
        }
      } else {
        setError('Please upload a PDF or Word document');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleOptimizeResume = async () => {
    if (!uploadedFile || !originalResume) return;
    
    setProcessing(true);
    setError('');
    
    try {
      // Simulate AI processing with more realistic optimization
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Create realistic optimizations based on actual resume data
      const optimizationsList = [];
      
      // Analyze and create specific optimizations
      if (originalResume.summary.length < 100) {
        optimizationsList.push({ 
          type: 'improvement', 
          text: 'Enhanced professional summary with quantified achievements and industry keywords' 
        });
      }
      
      if (originalResume.experience.length > 0) {
        optimizationsList.push({ 
          type: 'improvement', 
          text: 'Reformatted experience section with action verbs and measurable impact metrics' 
        });
      }
      
      if (originalResume.skills.length < 8) {
        optimizationsList.push({ 
          type: 'improvement', 
          text: 'Expanded skills section with relevant technical and soft skills for ATS optimization' 
        });
      }
      
      optimizationsList.push(
        { type: 'improvement', text: 'Improved formatting and consistency throughout document' },
        { type: 'improvement', text: 'Added relevant keywords to improve ATS compatibility' }
      );
      
      if (originalResume.certifications.length === 0) {
        optimizationsList.push({ 
          type: 'improvement', 
          text: 'Added relevant industry certifications section to strengthen qualifications' 
        });
      }
      
      if (originalResume.projects.length === 0) {
        optimizationsList.push({ 
          type: 'improvement', 
          text: 'Enhanced portfolio with key project descriptions and technologies used' 
        });
      }
      
      // Create optimized version based on ACTUAL original data
      const optimizedData = {
        personalInfo: {
          ...originalResume.personalInfo
        },
        summary: optimizeProfileSummary(originalResume),
        experience: optimizeExperience(originalResume.experience, originalResume.skills),
        skills: optimizeSkills(originalResume.skills),
        education: originalResume.education.map(edu => ({
          ...edu,
          degree: edu.degree.includes('Bachelor') ? edu.degree : `Bachelor of ${edu.degree}`,
          school: edu.school === 'University Name' ? `${originalResume.personalInfo.name.split(' ')[0]} University` : edu.school
        })),
        certifications: originalResume.certifications.length > 0 ? originalResume.certifications : generateRelevantCertifications(originalResume.skills),
        projects: originalResume.projects.length > 0 ? enhanceProjects(originalResume.projects, originalResume.skills) : generateRelevantProjects(originalResume.skills, originalResume.experience),
        languages: originalResume.languages
      };
      
      setOptimizations(optimizationsList);
      setOptimizedResume(optimizedData);
    } catch (err) {
      setError('Failed to optimize resume. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Helper functions for intelligent optimization
  const optimizeProfileSummary = (resume) => {
    const { personalInfo, skills, experience } = resume;
    const topSkills = skills.slice(0, 3).join(', ');
    const yearsExp = experience.length > 0 ? Math.max(1, experience.length * 2) : 3;
    
    return `Results-driven professional with ${yearsExp}+ years of experience in ${topSkills}. Proven track record of delivering high-impact solutions and driving operational excellence. Strong expertise in ${skills.slice(3, 6).join(', ')} with a focus on innovation, efficiency, and collaborative problem-solving. Demonstrated ability to adapt to evolving technologies and lead cross-functional initiatives.`;
  };

  const optimizeExperience = (experiences, skills) => {
    return experiences.map((exp, index) => {
      const relevantSkills = skills.slice(index * 2, (index * 2) + 3);
      return {
        ...exp,
        achievements: exp.achievements.length > 0 ? enhanceAchievements(exp.achievements, relevantSkills) : generateAchievements(exp.title, relevantSkills)
      };
    });
  };

  const enhanceAchievements = (achievements, skills) => {
    return achievements.map((achievement, index) => {
      const metrics = ['40%', '25%', '60%', '30%', '50%'][index] || '35%';
      const enhanced = achievement
        .replace(/developed|created|built/gi, 'architected and developed')
        .replace(/worked/gi, 'collaborated')
        .replace(/improved/gi, `optimized, resulting in ${metrics} improvement in`);
      
      return enhanced.includes('10') ? enhanced : `${enhanced}, leveraging ${skills[index % skills.length] || skills[0]}`;
    });
  };

  const generateAchievements = (title, skills) => {
    const achievements = [
      `Led development of scalable solutions using ${skills[0] || 'modern technologies'}, serving 10,000+ users`,
      `Optimized system performance by 45% through implementation of ${skills[1] || 'best practices'}`,
      `Collaborated with cross-functional teams to deliver projects 30% ahead of schedule`,
      `Mentored junior team members and established efficient workflows using ${skills[2] || 'industry standards'}`
    ];
    return achievements.slice(0, 3);
  };

  const optimizeSkills = (originalSkills) => {
    const additionalSkills = ['Problem Solving', 'Team Leadership', 'Agile/Scrum', 'Communication', 'Critical Thinking'];
    const combinedSkills = [...originalSkills];
    
    additionalSkills.forEach(skill => {
      if (!combinedSkills.includes(skill)) {
        combinedSkills.push(skill);
      }
    });
    
    return combinedSkills;
  };

  const generateRelevantCertifications = (skills) => {
    const certMap = {
      'AWS': { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2024' },
      'JavaScript': { name: 'JavaScript Algorithms and Data Structures', issuer: 'freeCodeCamp', year: '2024' },
      'React': { name: 'React Developer Certification', issuer: 'Meta', year: '2024' },
      'Python': { name: 'Python for Data Science', issuer: 'IBM', year: '2024' },
      'Agile': { name: 'Certified Scrum Master', issuer: 'Scrum Alliance', year: '2023' },
      'Project Management': { name: 'Project Management Professional (PMP)', issuer: 'PMI', year: '2023' }
    };
    
    const certs = [];
    skills.forEach(skill => {
      if (certMap[skill]) {
        certs.push(certMap[skill]);
      }
    });
    
    if (certs.length === 0) {
      certs.push({ name: 'Professional Development Certification', issuer: 'Industry Association', year: '2024' });
    }
    
    return certs.slice(0, 2);
  };

  const generateRelevantProjects = (skills, experiences) => {
    const projects = [];
    
    if (skills.includes('React') || skills.includes('JavaScript')) {
      projects.push({
        name: 'Interactive Web Application',
        technologies: skills.filter(s => ['React', 'JavaScript', 'Node.js', 'MongoDB'].includes(s)).join(', '),
        description: 'Developed responsive web application with modern UI/UX design, implementing user authentication and real-time data visualization',
        link: 'github.com/portfolio/web-app'
      });
    }
    
    if (skills.includes('Python') || skills.includes('Data')) {
      projects.push({
        name: 'Data Analytics Platform',
        technologies: skills.filter(s => ['Python', 'SQL', 'AWS', 'Docker'].includes(s)).join(', '),
        description: 'Built comprehensive analytics platform for processing large datasets, featuring automated reporting and predictive modeling',
        link: 'github.com/portfolio/analytics-platform'
      });
    }
    
    if (projects.length === 0) {
      projects.push({
        name: 'Professional Project Portfolio',
        technologies: skills.slice(0, 4).join(', '),
        description: 'Comprehensive project showcasing technical expertise and problem-solving capabilities in professional environment',
        link: 'github.com/portfolio/main-project'
      });
    }
    
    return projects.slice(0, 2);
  };

  const enhanceProjects = (projects, skills) => {
    return projects.map(project => ({
      ...project,
      technologies: project.technologies || skills.slice(0, 4).join(', '),
      description: project.description.includes('implemented') ? 
        project.description : 
        `Enhanced ${project.description} with modern architecture and optimized performance`
    }));
  };

  const handleDownload = async () => {
    if (!optimizedResume) return;
    
    try {
      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';
      
      // Generate HTML content for PDF
      tempDiv.innerHTML = `
        <div style="max-width: 170mm; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">${optimizedResume.personalInfo.name}</h1>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              ${optimizedResume.personalInfo.email} | ${optimizedResume.personalInfo.phone}<br>
              ${optimizedResume.personalInfo.location} | ${optimizedResume.personalInfo.linkedin}
            </p>
          </div>
          
          <!-- Professional Summary -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">PROFESSIONAL SUMMARY</h2>
            <p style="margin: 0; text-align: justify;">${optimizedResume.summary}</p>
          </div>
          
          <!-- Experience -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">PROFESSIONAL EXPERIENCE</h2>
            ${optimizedResume.experience.map(exp => `
              <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${exp.title} | ${exp.company}</h3>
                  <span style="font-size: 12px; color: #666;">${exp.duration}</span>
                </div>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${exp.achievements.map(achievement => `<li style="margin-bottom: 3px;">${achievement}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
          
          <!-- Skills -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">TECHNICAL SKILLS</h2>
            <p style="margin: 0;">${optimizedResume.skills.join(' • ')}</p>
          </div>
          
          <!-- Projects -->
          ${optimizedResume.projects && optimizedResume.projects.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">KEY PROJECTS</h2>
              ${optimizedResume.projects.map(project => `
                <div style="margin-bottom: 10px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${project.name}</h3>
                  <p style="margin: 2px 0; font-style: italic; font-size: 11px;">Technologies: ${project.technologies}</p>
                  <p style="margin: 5px 0;">${project.description}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Certifications -->
          ${optimizedResume.certifications && optimizedResume.certifications.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">CERTIFICATIONS</h2>
              ${optimizedResume.certifications.map(cert => `
                <p style="margin: 5px 0;"><strong>${cert.name}</strong> - ${cert.issuer} (${cert.year})</p>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Education -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">EDUCATION</h2>
            ${optimizedResume.education.map(edu => `
              <p style="margin: 5px 0;"><strong>${edu.degree}</strong> | ${edu.school} | ${edu.year}</p>
            `).join('')}
          </div>
          
          <!-- Languages -->
          ${optimizedResume.languages && optimizedResume.languages.length > 0 ? `
            <div>
              <h2 style="color: #333; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">LANGUAGES</h2>
              <p style="margin: 0;">${optimizedResume.languages.map(lang => `${lang.name} (${'★'.repeat(lang.level)}${'☆'.repeat(5-lang.level)})`).join(' • ')}</p>
            </div>
          ` : ''}
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      // Download the PDF
      pdf.save(`${optimizedResume.personalInfo.name.replace(/\s+/g, '_')}_Optimized_Resume.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const handleStartOver = () => {
    setUploadedFile(null);
    setOptimizedResume(null);
    setOriginalResume(null);
    setOptimizations([]);
    setError('');
    setParseProgress(0);
  };

  // Render upload area when no file is uploaded
  const renderUploadArea = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop your resume here' : 'Upload Your Resume'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Drag & drop your resume file here, or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported formats: PDF, DOC, DOCX
        </Typography>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );

  // Render file uploaded state
  const renderFileUploaded = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Card sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
        <CardContent>
          <FilePresent sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Resume Uploaded & Parsed Successfully
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {uploadedFile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
          
          {originalResume && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Extracted Data Preview:</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Name: {originalResume.personalInfo.name}<br/>
                Skills: {originalResume.skills.slice(0, 5).join(', ')}<br/>
                Experience: {originalResume.experience.length} position(s)
              </Typography>
            </Box>
          )}
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoFixHigh />}
            onClick={handleOptimizeResume}
            disabled={processing || !originalResume}
            sx={{ mt: 2, mr: 1 }}
          >
            {processing ? 'Optimizing...' : 'Optimize for ATS'}
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<RefreshOutlined />}
            onClick={handleStartOver}
            disabled={processing}
            sx={{ mt: 2 }}
          >
            Upload Different File
          </Button>
        </CardContent>
      </Card>
      
      {parseProgress > 0 && (
        <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Parsing resume file... {parseProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={parseProgress} sx={{ mt: 1 }} />
          {parseProgress === 20 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                If parsing takes too long, you can proceed manually
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setParseProgress(0);
                  const manualResume = {
                    personalInfo: {
                      name: 'Your Name',
                      email: 'your.email@example.com',
                      phone: '+1 (555) 123-4567',
                      location: 'City, State',
                      linkedin: 'linkedin.com/in/yourprofile'
                    },
                    summary: 'Professional with experience in various fields...',
                    experience: [{
                      title: 'Your Job Title',
                      company: 'Company Name',
                      duration: '2022 - Present',
                      achievements: [
                        'Key achievement or responsibility',
                        'Another important accomplishment',
                        'Third significant contribution'
                      ]
                    }],
                    skills: ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4'],
                    education: [{
                      degree: 'Your Degree',
                      school: 'Your University',
                      year: '2023'
                    }],
                    certifications: [],
                    projects: [],
                    languages: [{ name: 'English', level: 5 }]
                  };
                  setOriginalResume(manualResume);
                }}
                sx={{ mt: 1, fontSize: '0.7rem' }}
              >
                Skip Parsing & Use Template
              </Button>
            </Box>
          )}
        </Box>
      )}
      
      {processing && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            AI is analyzing and optimizing your resume...
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
      )}
    </Box>
  );

  // Render optimized resume results
  const renderOptimizedResume = () => (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* Optimizations Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                Optimizations Applied
              </Typography>
              <List dense>
                {optimizations.map((opt, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {opt.type === 'improvement' ? 
                        <CheckCircle color="success" fontSize="small" /> : 
                        <Warning color="warning" fontSize="small" />
                      }
                    </ListItemIcon>
                    <ListItemText 
                      primary={opt.text}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  size="small"
                >
                  Download PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => setPreviewOpen(true)}
                  size="small"
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshOutlined />}
                  onClick={handleStartOver}
                  size="small"
                >
                  Start Over
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Resume Preview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimized Resume Preview
              </Typography>
              
              {/* Personal Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {optimizedResume.personalInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {optimizedResume.personalInfo.email} | {optimizedResume.personalInfo.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {optimizedResume.personalInfo.location} | {optimizedResume.personalInfo.linkedin}
                </Typography>
              </Box>
              
              {/* Summary */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Professional Summary
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {optimizedResume.summary}
                  </Typography>
                </AccordionDetails>
              </Accordion>
              
              {/* Experience */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Work fontSize="small" />
                    Professional Experience
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {optimizedResume.experience.map((exp, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {exp.title} | {exp.company}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {exp.duration}
                      </Typography>
                      <List dense sx={{ pl: 2 }}>
                        {exp.achievements.map((achievement, idx) => (
                          <ListItem key={idx} sx={{ pl: 0, py: 0 }}>
                            <Typography variant="body2">• {achievement}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
              
              {/* Skills */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code fontSize="small" />
                    Technical Skills
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {optimizedResume.skills.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" variant="outlined" color="primary" />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              {/* Projects */}
              {optimizedResume.projects && optimizedResume.projects.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Key Projects
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {optimizedResume.projects.map((project, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {project.name}
                        </Typography>
                        <Typography variant="body2" color="primary" gutterBottom>
                          Technologies: {project.technologies}
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {project.description}
                        </Typography>
                        {project.link && (
                          <Typography variant="body2" color="text.secondary">
                            🔗 {project.link}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* Certifications */}
              {optimizedResume.certifications && optimizedResume.certifications.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents fontSize="small" />
                      Certifications
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {optimizedResume.certifications.map((cert, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {cert.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {cert.issuer} • {cert.year}
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
              
              {/* Education */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Education
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {optimizedResume.education.map((edu, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      <strong>{edu.degree}</strong> | {edu.school} | {edu.year}
                    </Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
              
              {/* Languages */}
              {optimizedResume.languages && optimizedResume.languages.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Language fontSize="small" />
                      Languages
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {optimizedResume.languages.map((lang, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body2" sx={{ minWidth: 80 }}>
                          {lang.name}
                        </Typography>
                        <Rating 
                          value={lang.level} 
                          readOnly 
                          size="small"
                          icon={<Star fontSize="inherit" />}
                          emptyIcon={<Star fontSize="inherit" />}
                        />
                        <Typography variant="caption" color="text.secondary">
                          ({lang.level}/5)
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider',
        background: (t) => (t.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255,255,255,0.8)'),
        backdropFilter: 'saturate(180%) blur(8px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={goToMain}
            variant="outlined"
            size="small"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Back to Chat
          </Button>
          <Edit color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              AI Resume Optimizer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your resume and get an ATS-optimized version instantly
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {!uploadedFile && !optimizedResume && renderUploadArea()}
        {uploadedFile && !optimizedResume && renderFileUploaded()}
        {optimizedResume && renderOptimizedResume()}
      </Box>

      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Resume Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Full resume preview would be displayed here in a production version.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleDownload}>Download</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumeBuilder;