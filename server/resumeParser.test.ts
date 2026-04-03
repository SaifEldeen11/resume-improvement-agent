import { describe, it, expect } from "vitest";
import { parseResumeContent, validateResumeContent } from "./resumeParser";

describe("Resume Parser", () => {
  describe("parseResumeContent", () => {
    it("should parse a complete resume into sections", () => {
      const resumeText = `
        JOHN DOE
        john@example.com | (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years in full-stack development.
        
        EXPERIENCE
        Senior Software Engineer at TechCorp
        - Led development of microservices architecture
        - Improved system performance by 40%
        
        EDUCATION
        BS Computer Science, State University
        Graduated 2019
        
        SKILLS
        JavaScript, TypeScript, React, Node.js, AWS
      `;

      const result = parseResumeContent(resumeText);

      expect(result.contact).toBeDefined();
      expect(result.summary).toContain("Experienced");
      expect(result.experience).toContain("Senior");
      expect(result.education).toContain("Computer Science");
      expect(result.skills).toContain("JavaScript");
    });

    it("should handle resume with minimal sections", () => {
      const resumeText = `
        EXPERIENCE
        Developer at Company
        - Built features
        
        SKILLS
        JavaScript, Python
      `;

      const result = parseResumeContent(resumeText);

      expect(result.experience).toContain("Developer");
      expect(result.skills).toContain("JavaScript");
    });

    it("should extract content even with inconsistent formatting", () => {
      const resumeText = `
        experience:
        - Worked as Engineer
        
        skills:
        - Java
        - Python
      `;

      const result = parseResumeContent(resumeText);

      // Should still capture some content
      expect(Object.values(result).some((section) => section.length > 0)).toBe(true);
    });
  });

  describe("validateResumeContent", () => {
    it("should validate a proper resume", () => {
      const validResume = `
        PROFESSIONAL SUMMARY
        Experienced professional with 10+ years in software development.
        
        EXPERIENCE
        Senior Engineer at Tech Company
        - Led team of 5 engineers
        - Increased productivity by 50%
        
        EDUCATION
        BS Computer Science
      `;

      const result = validateResumeContent(validResume);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty content", () => {
      const result = validateResumeContent("");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject content that is too short", () => {
      const result = validateResumeContent("Short text");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("too short");
    });

    it("should reject content without resume keywords", () => {
      const notAResume = `
        This is a story about a person who lived in a house.
        They had many adventures and friends.
        It was a wonderful time in their life.
        They learned many lessons along the way.
      `;

      const result = validateResumeContent(notAResume);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("does not appear to be a resume");
    });

    it("should accept resume with at least one keyword", () => {
      const minimalResume = `
        This document describes my professional experience in detail.
        I have worked as a developer for many years.
        My education includes a degree in computer science.
        I have developed many applications and systems.
      `;

      const result = validateResumeContent(minimalResume);

      expect(result.isValid).toBe(true);
    });
  });
});
