import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createResume, getUserResumes, createResumeImprovement, getResumeImprovements, updateResumeImprovement } from "./db";
import { extractResumeText, parseResumeContent, validateResumeContent } from "./resumeParser";
import { improveResume, optimizeForATS, Change } from "./resumeImprover";
import { generateResumePDF, generateChangeSummaryPDF } from "./pdfGenerator";
import { storagePut, storageGet } from "./storage";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const resumeRouter = router({
  /**
   * Upload a resume file and extract its content
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileType: z.enum(["pdf", "image"]),
        originalContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate resume content
        const validation = validateResumeContent(input.originalContent);
        if (!validation.isValid) {
          throw new Error(validation.error || "Invalid resume content");
        }

        // Create resume record in database
        await createResume({
          userId: ctx.user.id,
          fileName: input.fileName,
          originalContent: input.originalContent,
          fileKey: input.fileKey,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
        });

        return {
          success: true,
          resumeId: 1,
          content: input.originalContent,
        };
      } catch (error) {
        throw new Error(`Failed to upload resume: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Improve a resume based on user instructions
   */
  improve: protectedProcedure
    .input(
      z.object({
        resumeId: z.number(),
        instructions: z.string().min(10, "Instructions must be at least 10 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the resume
        const resumes = await getUserResumes(ctx.user.id);
        const resume = resumes.find((r) => r.id === input.resumeId);

        if (!resume) {
          throw new Error("Resume not found");
        }

        // Create improvement record with pending status
        await createResumeImprovement({
          resumeId: input.resumeId,
          userId: ctx.user.id,
          instructions: input.instructions,
          originalContent: resume.originalContent,
          improvedContent: "",
          changeSummary: JSON.stringify([]),
          status: "pending",
        });

        const improvementId = 1;

        try {
          // Improve the resume using LLM
          const improvementData = await improveResume(resume.originalContent, input.instructions);

          // Optimize for ATS
          const atsOptimized = await optimizeForATS(improvementData.improvedContent);

          // Generate PDF from improved content
          const tempDir = os.tmpdir();
          const pdfPath = path.join(tempDir, `resume-${improvementId}-${Date.now()}.docx`);
          await generateResumePDF(atsOptimized, pdfPath);

          // Upload PDF to storage
          const pdfBuffer = fs.readFileSync(pdfPath);
          const pdfFileKey = `resumes/${ctx.user.id}/improvement-${improvementId}.docx`;
          const { url: pdfUrl } = await storagePut(pdfFileKey, pdfBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

          // Clean up temp file
          fs.unlinkSync(pdfPath);

          // Update improvement record with results
          await updateResumeImprovement(improvementId, {
            improvedContent: atsOptimized,
            changeSummary: JSON.stringify(improvementData.changes),
            pdfFileKey,
            pdfUrl,
            status: "completed",
          });

          return {
            success: true,
            improvementId,
            improvedContent: atsOptimized,
            changes: improvementData.changes,
            pdfUrl,
          };
        } catch (error) {
          // Update with error status
          await updateResumeImprovement(improvementId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });

          throw error;
        }
      } catch (error) {
        throw new Error(`Failed to improve resume: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get user's resume improvement history
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const improvements = await getResumeImprovements(ctx.user.id, 20);
      return improvements.map((imp) => ({
        id: imp.id,
        resumeId: imp.resumeId,
        instructions: imp.instructions,
        status: imp.status,
        createdAt: imp.createdAt,
        pdfUrl: imp.pdfUrl,
        changeCount: imp.changeSummary ? JSON.parse(imp.changeSummary).length : 0,
      }));
    } catch (error) {
      throw new Error(`Failed to get history: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),

  /**
   * Get specific improvement details
   */
  getImprovement: protectedProcedure
    .input(
      z.object({
        improvementId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const improvements = await getResumeImprovements(ctx.user.id);
        const improvement = improvements.find((imp) => imp.id === input.improvementId);

        if (!improvement) {
          throw new Error("Improvement not found");
        }

        return {
          id: improvement.id,
          resumeId: improvement.resumeId,
          instructions: improvement.instructions,
          originalContent: improvement.originalContent,
          improvedContent: improvement.improvedContent,
          changes: improvement.changeSummary ? JSON.parse(improvement.changeSummary) : [],
          status: improvement.status,
          pdfUrl: improvement.pdfUrl,
          createdAt: improvement.createdAt,
        };
      } catch (error) {
        throw new Error(`Failed to get improvement: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Download improvement as PDF
   */
  downloadPDF: protectedProcedure
    .input(
      z.object({
        improvementId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const improvements = await getResumeImprovements(ctx.user.id);
        const improvement = improvements.find((imp) => imp.id === input.improvementId);

        if (!improvement || !improvement.pdfUrl) {
          throw new Error("PDF not found");
        }

        return {
          success: true,
          pdfUrl: improvement.pdfUrl,
          fileName: `resume-improved-${improvement.id}.docx`,
        };
      } catch (error) {
        throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
