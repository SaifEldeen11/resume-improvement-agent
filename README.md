# AI-Powered Resume Improvement Agent

A professional resume consultant AI that helps users upload, analyze, and optimize their resumes with intelligent suggestions and ATS optimization.

## Features

### Core Functionality
- **Resume Upload**: Support for PDF and image formats with automatic text extraction
- **AI Analysis**: LLM-powered resume analysis applying user-specific instructions
- **ATS Optimization**: Automatic optimization for Applicant Tracking Systems
- **Professional PDF Generation**: Clean, well-formatted output documents
- **Change Tracking**: Detailed summary of all modifications with rationale
- **Resume History**: Track all improvements and access past versions

### Technical Highlights
- **Text Extraction**: PDF parsing with `pdf-parse` and OCR with `tesseract.js`
- **Intelligent Processing**: LLM-powered improvement engine with professional best practices
- **Database Persistence**: MySQL database for resume and improvement history
- **Authentication**: Built-in OAuth integration with user management
- **Full-Stack**: React 19 frontend with Express/tRPC backend

## Getting Started

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL database
- Manus OAuth credentials (for authentication)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd resume-improvement-agent

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env and fill in your credentials
cp .env.example .env

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
resume-improvement-agent/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities and hooks
│   │   └── App.tsx           # Main app component
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── resumeParser.ts       # PDF/OCR text extraction
│   ├── resumeImprover.ts     # LLM improvement engine
│   ├── pdfGenerator.ts       # Document generation
│   ├── resumeProcedures.ts   # tRPC procedures
│   ├── routers.ts            # API routes
│   └── db.ts                 # Database queries
├── drizzle/                   # Database schema and migrations
├── storage/                   # S3 storage helpers
└── shared/                    # Shared types and constants
```

## API Endpoints

All API endpoints are exposed via tRPC at `/api/trpc`

### Resume Procedures

#### Upload Resume
```typescript
trpc.resume.upload.mutate({
  fileName: string,
  fileUrl: string,
  fileKey: string,
  fileType: "pdf" | "image",
  originalContent: string
})
```

#### Improve Resume
```typescript
trpc.resume.improve.mutate({
  resumeId: number,
  instructions: string
})
```

#### Get History
```typescript
trpc.resume.getHistory.query()
```

#### Get Improvement Details
```typescript
trpc.resume.getImprovement.query({
  improvementId: number
})
```

#### Download PDF
```typescript
trpc.resume.downloadPDF.mutate({
  improvementId: number
})
```

## Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
```

### Starting Production Server
```bash
pnpm start
```

## Key Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express 4, tRPC 11, Drizzle ORM
- **Database**: MySQL with Drizzle migrations
- **AI/ML**: LLM integration via Manus Forge API
- **Text Processing**: pdf-parse, tesseract.js
- **Document Generation**: docx library
- **Storage**: S3 for file storage
- **Authentication**: Manus OAuth

## Resume Improvement Process

1. **Upload**: User uploads resume (PDF or image)
2. **Extract**: System extracts text using PDF parser or OCR
3. **Parse**: Content is parsed into sections (contact, experience, skills, etc.)
4. **Analyze**: LLM analyzes resume against user instructions
5. **Optimize**: Content is optimized for ATS with action verbs and keywords
6. **Generate**: Professional DOCX document is created
7. **Track**: Changes are documented with rationale
8. **Store**: Results are saved to database for history

## ATS Optimization Features

- Clean, simple formatting without tables or special characters
- Standard section headers for easy parsing
- Action-verb-driven bullet points
- Quantifiable metrics and results
- Relevant keywords for industry
- Consistent date formatting
- Proper spacing and hierarchy

## Best Practices Applied

- **Never fabricate**: Only improves existing content, never adds false experience
- **Professional tone**: Maintains industry-standard resume language
- **Consistent formatting**: Ensures visual coherence throughout
- **Keyword optimization**: Includes relevant terms for ATS scanning
- **Actionable changes**: All modifications have clear rationale
- **User control**: Respects user instructions while applying best practices

## Error Handling

The application includes comprehensive error handling for:
- Unreadable or corrupted PDF files
- Invalid image formats
- Insufficient resume content
- Missing resume keywords
- File size limitations (10MB max)
- LLM processing failures
- Database errors

## Security Considerations

- User authentication required for all operations
- Resume data encrypted in transit and at rest
- File uploads validated for type and size
- S3 storage with proper access controls
- Environment variables for sensitive configuration
- SQL injection prevention via ORM

## Future Enhancements

- Real-time preview of improvements
- Multiple resume templates
- Industry-specific optimization
- Skill gap analysis
- Interview preparation tips
- Cover letter generation
- Batch processing for multiple resumes
- Export to multiple formats (PDF, Word, Google Docs)

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Built with React, Express, and TypeScript
- Uses Manus platform for OAuth and LLM integration
- Powered by tesseract.js for OCR and pdf-parse for PDF extraction
- UI components from shadcn/ui and Radix UI
