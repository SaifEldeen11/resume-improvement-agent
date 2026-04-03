import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, VerticalAlign, convertInchesToTwip } from "docx";
import * as fs from "fs";
import * as path from "path";

/**
 * Generate a professional PDF resume from text content
 */
export async function generateResumePDF(content: string, outputPath: string): Promise<void> {
  try {
    // Parse resume sections from content
    const sections = parseResumeSections(content);

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: generateDocumentContent(sections),
        },
      ],
    });

    // Write to file
    const bytes = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, bytes);
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

interface ResumeSection {
  title: string;
  content: string[];
}

/**
 * Parse resume content into structured sections
 */
function parseResumeSections(content: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  const lines = content.split("\n");

  let currentSection: ResumeSection | null = null;
  const sectionHeaders = [
    "CONTACT",
    "PROFESSIONAL SUMMARY",
    "EXPERIENCE",
    "EDUCATION",
    "SKILLS",
    "CERTIFICATIONS",
    "PROJECTS",
    "LANGUAGES",
    "AWARDS",
    "VOLUNTEER",
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this is a section header
    const isHeader = sectionHeaders.some((header) => trimmedLine.toUpperCase().includes(header));

    if (isHeader && trimmedLine.length < 50) {
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: trimmedLine,
        content: [],
      };
    } else if (currentSection && trimmedLine.length > 0) {
      currentSection.content.push(trimmedLine);
    }
  }

  // Add last section
  if (currentSection && currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Generate document content for docx
 */
function generateDocumentContent(sections: ResumeSection[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const section of sections) {
    // Add section header
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 200,
          after: 100,
        },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      })
    );

    // Add section content
    for (const line of section.content) {
      const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
      const cleanLine = isBullet ? line.substring(1).trim() : line;

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanLine,
              size: 22,
            }),
          ],
          bullet: {
            level: 0,
          },
          spacing: {
            before: 50,
            after: 50,
            line: 240,
          },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Generate a summary document of changes
 */
export async function generateChangeSummaryPDF(
  changes: Array<{
    section: string;
    original: string;
    improved: string;
    reason: string;
  }>,
  outputPath: string
): Promise<void> {
  try {
    const rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Section", bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Original", bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Improved", bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Reason", bold: true })],
              }),
            ],
          }),
        ],
      }),
    ];

    for (const change of changes) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(change.section)],
            }),
            new TableCell({
              children: [new Paragraph(change.original.substring(0, 50) + (change.original.length > 50 ? "..." : ""))],
            }),
            new TableCell({
              children: [new Paragraph(change.improved.substring(0, 50) + (change.improved.length > 50 ? "..." : ""))],
            }),
            new TableCell({
              children: [new Paragraph(change.reason)],
            }),
          ],
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Resume Improvement Summary",
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Total Changes: ${changes.length}`,
                  size: 22,
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows,
            }),
          ],
        },
      ],
    });

    const bytes = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, bytes);
  } catch (error) {
    throw new Error(`Failed to generate summary PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
