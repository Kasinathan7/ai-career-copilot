import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerator {
  constructor() {
    this.margins = {
      top: 25,
      bottom: 25,
      left: 40,
      right: 40
    };
    this.pageWidth = 612; // Letter size width in points
    this.pageHeight = 792; // Letter size height in points
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
  }

  /**
   * Generate ATS-optimized PDF resume
   */
  async generateATSResumePDF(resumeData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: this.margins,
          bufferPages: true
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header with name and contact
        this.addHeader(doc, resumeData.personalInfo);
        
        // Summary section
        if (resumeData.summary) {
          this.addSummary(doc, resumeData.summary);
        }

        // Experience section
        if (resumeData.experience && resumeData.experience.length > 0) {
          this.addExperience(doc, resumeData.experience);
        }

        // Education section
        if (resumeData.education && resumeData.education.length > 0) {
          this.addEducation(doc, resumeData.education);
        }

        // Other sections (Skills, Certifications, etc.)
        this.addOtherSections(doc, resumeData);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header with name and contact information
   */
  addHeader(doc, personalInfo) {
    if (!personalInfo) return;

    // Name - centered and bold
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(personalInfo.name || 'Name Not Provided', this.margins.left, this.margins.top, {
         width: this.contentWidth,
         align: 'center'
       });

    // Contact info - centered below name with bullet separators
    const contactParts = [];
    if (personalInfo.location) contactParts.push(personalInfo.location);
    if (personalInfo.email) contactParts.push(personalInfo.email);
    if (personalInfo.phone) contactParts.push(personalInfo.phone);
    if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);

    if (contactParts.length > 0) {
      doc.moveDown(0.3);
      doc.fontSize(8.5)
         .font('Helvetica')
         .text(contactParts.join('  •  '), {
           width: this.contentWidth,
           align: 'center'
         });
    }

    doc.moveDown(0.8);
  }

  /**
   * Add professional summary section
   */
  addSummary(doc, summary) {
    if (!summary) return;

    // Add horizontal line
    doc.moveTo(this.margins.left, doc.y)
       .lineTo(this.pageWidth - this.margins.right, doc.y)
       .lineWidth(0.5)
       .stroke();
    
    doc.moveDown(0.3);

    // Section header - uppercase and bold
    doc.fontSize(9.5)
       .font('Helvetica-Bold')
       .text('PROFESSIONAL SUMMARY', {
         align: 'left'
       });
    
    // Add underline for section header
    doc.moveDown(0.1);
    const lineY = doc.y;
    doc.moveTo(this.margins.left, lineY)
       .lineTo(this.pageWidth - this.margins.right, lineY)
       .lineWidth(0.5)
       .stroke();
    
    doc.moveDown(0.3);

    // Summary content
    doc.fontSize(8.5)
       .font('Helvetica')
       .text(summary, {
         width: this.contentWidth,
         align: 'left',
         lineGap: 1
       });

    doc.moveDown(0.6);
  }

  /**
   * Add experience section
   */
  addExperience(doc, experiences) {
    if (!experiences || experiences.length === 0) return;

    // Section header with underline
    doc.fontSize(9.5)
       .font('Helvetica-Bold')
       .text('PROFESSIONAL EXPERIENCE', {
         align: 'left'
       });
    
    // Add underline for section header
    doc.moveDown(0.1);
    const lineY = doc.y;
    doc.moveTo(this.margins.left, lineY)
       .lineTo(this.pageWidth - this.margins.right, lineY)
       .lineWidth(0.5)
       .stroke();
    
    doc.moveDown(0.4);

    experiences.forEach((exp, index) => {
      // Save starting Y position for this experience entry
      const entryStartY = doc.y;

      // Position title - bold (left side)
      if (exp.position) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text(exp.position, {
             continued: false
           });
      }

      // Dates and location on right side - on same line as position
      if (exp.startDate || exp.endDate || exp.location) {
        const rightInfo = [];
        if (exp.startDate || exp.endDate) {
          rightInfo.push(`${exp.startDate || ''} – ${exp.endDate || 'Present'}`);
        }
        if (exp.location) {
          rightInfo.push(exp.location);
        }
        
        doc.fontSize(8.5)
           .font('Helvetica')
           .text(rightInfo.join(',  '), this.margins.left, entryStartY, {
             width: this.contentWidth,
             align: 'right'
           });
      }

      // Company name - after position
      if (exp.company) {
        doc.moveDown(0.1);
        doc.fontSize(8.5)
           .font('Helvetica')
           .text(exp.company, {
             align: 'left'
           });
      }

      doc.moveDown(0.3);

      // Responsibilities as bullet points - limit to most important
      if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
        // Limit to 3-4 bullets per job for space
        const bullets = exp.responsibilities.slice(0, 4);
        bullets.forEach((resp) => {
          doc.fontSize(8.5)
             .font('Helvetica')
             .list([resp], {
               bulletRadius: 2,
               textIndent: 10,
               width: this.contentWidth - 10,
               lineGap: 1
             });
        });
      } else if (exp.description) {
        // If description instead of responsibilities array
        doc.fontSize(8.5)
           .font('Helvetica')
           .list([exp.description], {
             bulletRadius: 2,
             textIndent: 10,
             width: this.contentWidth - 10,
             lineGap: 1
           });
      }

      // Add spacing between experiences
      if (index < experiences.length - 1) {
        doc.moveDown(0.4);
      }
    });

    doc.moveDown(0.6);
  }

  /**
   * Add education section
   */
  addEducation(doc, education) {
    if (!education || education.length === 0) return;

    // Section header with underline
    doc.fontSize(9.5)
       .font('Helvetica-Bold')
       .text('EDUCATION', {
         align: 'left'
       });
    
    // Add underline for section header
    doc.moveDown(0.1);
    const lineY = doc.y;
    doc.moveTo(this.margins.left, lineY)
       .lineTo(this.pageWidth - this.margins.right, lineY)
       .lineWidth(0.5)
       .stroke();
    
    doc.moveDown(0.4);

    education.forEach((edu, index) => {
      // Save starting Y position
      const entryStartY = doc.y;

      // Degree - bold (left side)
      const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      if (degreeText) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text(degreeText, {
             continued: false
           });
      }

      // Year/Date and location on right side - on same line
      if (edu.graduationDate || edu.endDate || edu.year || edu.location) {
        const rightInfo = [];
        if (edu.location) rightInfo.push(edu.location);
        const date = edu.graduationDate || edu.endDate || edu.year;
        if (date) rightInfo.push(`• ${date}`);
        
        doc.fontSize(8.5)
           .font('Helvetica')
           .text(rightInfo.join('  '), this.margins.left, entryStartY, {
             width: this.contentWidth,
             align: 'right'
           });
      }

      // Institution name below degree
      if (edu.institution) {
        doc.moveDown(0.1);
        doc.fontSize(8.5)
           .font('Helvetica')
           .text(edu.institution, {
             align: 'left'
           });
      }

      // GPA if available - inline
      if (edu.gpa) {
        doc.moveDown(0.1);
        doc.fontSize(8)
           .font('Helvetica')
           .text(`• GPA: ${edu.gpa}`, {
             align: 'left'
           });
      }

      // Add spacing between education entries
      if (index < education.length - 1) {
        doc.moveDown(0.4);
      }
    });

    doc.moveDown(0.6);
  }

  /**
   * Add other sections (Skills, Certifications, Projects, etc.)
   */
  addOtherSections(doc, resumeData) {
    // Skills
    if (resumeData.skills) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('EXPERT-LEVEL SKILLS', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      let skillsText = '';
      if (typeof resumeData.skills === 'string') {
        skillsText = resumeData.skills;
      } else if (Array.isArray(resumeData.skills)) {
        skillsText = resumeData.skills.join(', ');
      } else if (typeof resumeData.skills === 'object') {
        // Handle categorized skills - single line with semicolons
        const categories = [];
        for (const [category, skills] of Object.entries(resumeData.skills)) {
          const skillsList = Array.isArray(skills) ? skills.join(', ') : skills;
          categories.push(`${category}: ${skillsList}`);
        }
        skillsText = categories.join('; ');
      }

      doc.fontSize(8.5)
         .font('Helvetica')
         .text(skillsText, {
           width: this.contentWidth,
           align: 'left',
           lineGap: 1
         });

      doc.moveDown(0.6);
    }

    // Consultancy/Freelance section
    if (resumeData.consultancy && resumeData.consultancy.length > 0) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('CONSULTANCY', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      resumeData.consultancy.forEach((consult, index) => {
        const startY = doc.y;
        
        // Role/Title
        const title = typeof consult === 'string' ? consult : (consult.title || consult.role);
        if (title) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .text(title, {
               continued: false
             });
        }
        
        // Company and dates on right
        if (typeof consult === 'object') {
          const rightInfo = [];
          if (consult.company) rightInfo.push(consult.company);
          if (consult.startDate || consult.endDate) {
            rightInfo.push(`• ${consult.startDate || ''} - ${consult.endDate || 'Present'}`);
          }
          
          if (rightInfo.length > 0) {
            doc.fontSize(8.5)
               .font('Helvetica')
               .text(rightInfo.join('  '), this.margins.left, startY, {
                 width: this.contentWidth,
                 align: 'right'
               });
          }
        }
        
        doc.moveDown(0.2);
        
        // Description
        if (typeof consult === 'object' && consult.description) {
          doc.fontSize(8.5)
             .font('Helvetica')
             .list([consult.description], {
               bulletRadius: 2,
               textIndent: 10,
               width: this.contentWidth - 10,
               lineGap: 1
             });
        }
        
        if (index < resumeData.consultancy.length - 1) {
          doc.moveDown(0.3);
        }
      });

      doc.moveDown(0.6);
    }

    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('CERTIFICATIONS', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      const certTexts = resumeData.certifications.map(cert => {
        if (typeof cert === 'string') return cert;
        let text = cert.name || cert.title || '';
        if (cert.issuer) text += ` - ${cert.issuer}`;
        if (cert.date) text += ` (${cert.date})`;
        return text;
      });

      doc.fontSize(8.5)
         .font('Helvetica')
         .list(certTexts, {
           bulletRadius: 2,
           textIndent: 10,
           width: this.contentWidth - 10,
           lineGap: 1
         });

      doc.moveDown(0.6);
    }

    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('PROJECTS', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      resumeData.projects.forEach((project, projIndex) => {
        const startY = doc.y;

        // Project name
        const projectName = typeof project === 'string' ? project : (project.name || project.title);
        doc.fontSize(8.5)
           .font('Helvetica-Bold')
           .text(projectName, {
             continued: false
           });

        // Project date on same line (right-aligned)
        if (typeof project === 'object' && project.date) {
          doc.fontSize(8.5)
             .font('Helvetica')
             .text(project.date, this.margins.left, startY, {
               width: this.contentWidth,
               align: 'right'
             });
        }

        doc.moveDown(0.2);

        // Project description
        if (typeof project === 'object' && project.description) {
          doc.fontSize(8.5)
             .font('Helvetica')
             .list([project.description], {
               bulletRadius: 2,
               textIndent: 10,
               width: this.contentWidth - 10,
               lineGap: 1
             });
        }

        if (projIndex < resumeData.projects.length - 1) {
          doc.moveDown(0.3);
        }
      });

      doc.moveDown(0.6);
    }

    // Languages
    if (resumeData.languages && resumeData.languages.length > 0) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('LANGUAGES', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      const languagesText = resumeData.languages.map(lang => {
        if (typeof lang === 'string') return lang;
        
        const name = lang.name || lang.language || lang.Language;
        const proficiency = lang.proficiency || lang.level || lang.Proficiency;
        
        if (!name) return null;
        
        return proficiency ? `${name} (${proficiency})` : name;
      }).filter(Boolean).join(', ');

      if (languagesText) {
        doc.fontSize(8.5)
           .font('Helvetica')
           .text(languagesText, {
             width: this.contentWidth,
             lineGap: 1
           });

        doc.moveDown(0.6);
      }
    }

    // Awards
    if (resumeData.awards && resumeData.awards.length > 0) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('AWARDS & HONORS', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      const awardTexts = resumeData.awards.map(award => {
        if (typeof award === 'string') return award;
        return award.date ? `${award.name} (${award.date})` : award.name;
      });

      doc.fontSize(8.5)
         .font('Helvetica')
         .list(awardTexts, {
           bulletRadius: 2,
           textIndent: 10,
           width: this.contentWidth - 10,
           lineGap: 1
         });

      doc.moveDown(0.6);
    }

    // Volunteer Experience
    if (resumeData.volunteer && resumeData.volunteer.length > 0) {
      doc.fontSize(9.5)
         .font('Helvetica-Bold')
         .text('VOLUNTEER EXPERIENCE', {
           align: 'left'
         });
      
      // Add underline for section header
      doc.moveDown(0.1);
      const lineY = doc.y;
      doc.moveTo(this.margins.left, lineY)
         .lineTo(this.pageWidth - this.margins.right, lineY)
         .lineWidth(0.5)
         .stroke();
      
      doc.moveDown(0.3);

      resumeData.volunteer.forEach((vol, volIndex) => {
        const startY = doc.y;

        // Role or Organization name
        const orgName = typeof vol === 'string' ? vol : (vol.role || vol.organization || vol.name);
        doc.fontSize(8.5)
           .font('Helvetica-Bold')
           .text(orgName, {
             continued: false
           });

        // Date on same line (right-aligned)
        if (typeof vol === 'object' && vol.date) {
          doc.fontSize(8.5)
             .font('Helvetica')
             .text(vol.date, this.margins.left, startY, {
               width: this.contentWidth,
               align: 'right'
             });
        }

        doc.moveDown(0.2);

        // Organization (if role was used above)
        if (typeof vol === 'object' && vol.role && vol.organization) {
          doc.fontSize(8.5)
             .font('Helvetica')
             .text(vol.organization, {
               align: 'left'
             });
          doc.moveDown(0.1);
        }

        // Description
        if (typeof vol === 'object' && vol.description) {
          doc.fontSize(8.5)
             .font('Helvetica')
             .list([vol.description], {
               bulletRadius: 2,
               textIndent: 10,
               width: this.contentWidth - 10,
               lineGap: 1
             });
        }

        if (volIndex < resumeData.volunteer.length - 1) {
          doc.moveDown(0.3);
        }
      });
    }
  }
}

export default new PDFGenerator();
