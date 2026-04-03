import * as fs from "fs";
import * as path from "path";
// @ts-ignore - pdf-parse has complex exports
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    // pdf-parse is a function that takes a buffer and returns a promise
    const data = await (pdfParse as any)(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Extract text from image file using OCR
 */
export async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => {
        // Log progress silently
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    return result.data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Extract text from resume file (PDF or image)
 */
export async function extractResumeText(filePath: string, fileType: "pdf" | "image"): Promise<string> {
  if (fileType === "pdf") {
    return extractTextFromPDF(filePath);
  } else {
    return extractTextFromImage(filePath);
  }
}

/**
 * Parse resume content into structured sections
 */
export interface ParsedResume {
  contact: string;
  summary: string;
  experience: string;
  skills: string;
  education: string;
  certifications: string;
  other: string;
}

export function parseResumeContent(text: string): ParsedResume {
  const sections: ParsedResume = {
    contact: "",
    summary: "",
    experience: "",
    skills: "",
    education: "",
    certifications: "",
    other: "",
  };

  // Convert to uppercase for case-insensitive matching
  const upperText = text.toUpperCase();
  const lines = text.split("\n");

  // Define section headers
  const sectionHeaders = {
    contact: ["CONTACT", "PERSONAL", "INFO"],
    summary: ["PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE", "PROFILE"],
    experience: ["EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT"],
    skills: ["SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES"],
    education: ["EDUCATION", "ACADEMIC", "TRAINING"],
    certifications: ["CERTIFICATIONS", "LICENSES", "CERTIFICATES"],
  };

  // Find section boundaries
  const sectionIndices: Record<string, number> = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    for (const [sectionKey, headers] of Object.entries(sectionHeaders)) {
      if (headers.some((header) => line.includes(header))) {
        sectionIndices[sectionKey] = i;
        break;
      }
    }
  }

  // Extract content for each section
  const sectionKeys = Object.keys(sectionHeaders);
  for (let i = 0; i < sectionKeys.length; i++) {
    const key = sectionKeys[i];
    const startIdx = sectionIndices[key];

    if (startIdx !== undefined) {
      // Find end index (next section or end of text)
      let endIdx = lines.length;
      for (let j = i + 1; j < sectionKeys.length; j++) {
        const nextKey = sectionKeys[j];
        const nextIdx = sectionIndices[nextKey];
        if (nextIdx !== undefined && nextIdx > startIdx) {
          endIdx = nextIdx;
          break;
        }
      }

      // Extract content
      const content = lines.slice(startIdx + 1, endIdx).join("\n").trim();
      sections[key as keyof ParsedResume] = content;
    }
  }

  return sections;
}

/**
 * Validate resume content
 */
export function validateResumeContent(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: "Resume content is empty" };
  }

  if (text.length < 100) {
    return { isValid: false, error: "Resume content is too short (minimum 100 characters)" };
  }

  // Check for common resume keywords to ensure it's likely a resume
  const resumeKeywords = [
    "experience",
    "education",
    "skills",
    "work",
    "employment",
    "degree",
    "university",
    "company",
    "position",
    "role",
  ];
  const hasResumeKeywords = resumeKeywords.some((keyword) => text.toLowerCase().includes(keyword));

  if (!hasResumeKeywords) {
    return { isValid: false, error: "Content does not appear to be a resume (missing common resume keywords)" };
  }

  return { isValid: true };
}
