import { invokeLLM } from "./_core/llm";

export interface Change {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

export interface ImprovementResult {
  improvedContent: string;
  changes: Change[];
}

/**
 * Improve resume using LLM based on user instructions
 */
export async function improveResume(
  resumeContent: string,
  userInstructions: string
): Promise<ImprovementResult> {
  const systemPrompt = `You are an expert professional resume consultant and career coach with 20+ years of experience.
Your role is to improve resumes by applying user instructions while maintaining authenticity and accuracy.

Resume Improvement Guidelines:
1. Apply every user instruction precisely and intelligently
2. Strengthen weak or passive language into strong, action-verb-driven bullet points
3. Ensure consistent formatting, tense, and style throughout
4. Optimize for ATS (Applicant Tracking Systems) by using clean structure and relevant keywords
5. Never fabricate experience, skills, or credentials - only rewrite and improve what is already present
6. Use power verbs like: Achieved, Implemented, Led, Designed, Developed, Optimized, Increased, Reduced, Managed, etc.
7. Quantify achievements with metrics and results where possible
8. Ensure proper grammar, spelling, and professional tone
9. Maintain consistent date formats and section organization
10. Highlight relevant skills and accomplishments for the target role

When improving the resume:
- Preserve all original information (dates, company names, credentials)
- Only enhance the language, structure, and presentation
- Make bullet points concise but impactful (typically 1-2 lines)
- Start each bullet with a strong action verb
- Include quantifiable results and impact metrics

Return the improved resume in the exact same format as the original, maintaining all section headers and structure.`;

  const userPrompt = `Please improve the following resume based on these user instructions:

USER INSTRUCTIONS:
${userInstructions}

ORIGINAL RESUME:
${resumeContent}

Provide the improved resume maintaining the same structure and format. Ensure all improvements are applied and the resume is ATS-optimized.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const improvedContent = typeof content === "string" ? content : "";

    if (!improvedContent) {
      throw new Error("LLM returned empty response");
    }

    // Extract changes by comparing original and improved
    const changes = extractChanges(resumeContent, improvedContent);

    return {
      improvedContent,
      changes,
    };
  } catch (error) {
    throw new Error(`Failed to improve resume: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Extract changes between original and improved resume
 */
function extractChanges(original: string, improved: string): Change[] {
  const changes: Change[] = [];

  // Split into lines and compare
  const originalLines = original.split("\n");
  const improvedLines = improved.split("\n");

  // Simple diff: find lines that changed
  const maxLines = Math.max(originalLines.length, improvedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i]?.trim() || "";
    const impLine = improvedLines[i]?.trim() || "";

    if (origLine && impLine && origLine !== impLine) {
      // Determine section based on context
      let section = "General";
      if (origLine.toLowerCase().includes("experience") || impLine.toLowerCase().includes("experience")) {
        section = "Experience";
      } else if (origLine.toLowerCase().includes("skill") || impLine.toLowerCase().includes("skill")) {
        section = "Skills";
      } else if (origLine.toLowerCase().includes("education") || impLine.toLowerCase().includes("education")) {
        section = "Education";
      } else if (origLine.toLowerCase().includes("summary") || impLine.toLowerCase().includes("summary")) {
        section = "Summary";
      }

      changes.push({
        section,
        original: origLine,
        improved: impLine,
        reason: generateChangeReason(origLine, impLine),
      });
    }
  }

  return changes;
}

/**
 * Generate reason for a change
 */
function generateChangeReason(original: string, improved: string): string {
  const reasons: string[] = [];

  // Check for action verb improvement
  const weakVerbs = ["was", "is", "are", "been", "did", "do", "made", "had"];
  const strongVerbs = [
    "achieved",
    "implemented",
    "led",
    "designed",
    "developed",
    "optimized",
    "increased",
    "reduced",
    "managed",
    "created",
    "spearheaded",
    "orchestrated",
    "accelerated",
  ];

  const hasWeakVerb = weakVerbs.some((verb) => original.toLowerCase().includes(verb));
  const hasStrongVerb = strongVerbs.some((verb) => improved.toLowerCase().includes(verb));

  if (hasWeakVerb && hasStrongVerb) {
    reasons.push("Replaced passive language with strong action verbs");
  }

  // Check for quantification
  if (!original.match(/\d+%|\d+\$|\d+x|increased|decreased|improved/i) && improved.match(/\d+%|\d+\$|\d+x|increased|decreased|improved/i)) {
    reasons.push("Added quantifiable metrics and results");
  }

  // Check for clarity improvement
  if (original.length > improved.length) {
    reasons.push("Made more concise and impactful");
  }

  // Check for ATS optimization
  if (improved.match(/[A-Z]{2,}/)) {
    reasons.push("Optimized for ATS with relevant keywords");
  }

  return reasons.length > 0 ? reasons.join("; ") : "Enhanced professional presentation";
}

/**
 * Generate ATS-optimized version of resume
 */
export async function optimizeForATS(resumeContent: string): Promise<string> {
  const systemPrompt = `You are an ATS (Applicant Tracking System) optimization expert. Your role is to format and optimize resumes to pass ATS scanning.

ATS Optimization Guidelines:
1. Use standard section headers: CONTACT INFORMATION, PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS
2. Use simple formatting - no tables, columns, or special characters
3. Use standard fonts and clear hierarchy
4. Include relevant keywords from the industry
5. Ensure consistent bullet point formatting
6. Use standard date formats (MM/YYYY)
7. Avoid graphics, images, headers, and footers
8. Use common abbreviations (BA, BS, MBA, etc.)
9. Include full company names and job titles
10. Ensure proper spacing and line breaks

Return the ATS-optimized resume maintaining all original information.`;

  const userPrompt = `Please optimize this resume for ATS scanning:

${resumeContent}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : resumeContent;
  } catch (error) {
    console.error("ATS optimization failed:", error);
    return resumeContent; // Return original if optimization fails
  }
}
