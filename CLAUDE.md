# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**DNA Spectrum** is a self-hosted personality assessment tool based on the H2 DNA Spectrum framework. It identifies natural behavioral patterns through a 30-question assessment mapped to six core archetypes and generates comprehensive Dual State profile reports.

**Target Audience**: Coaches, consultants, and HR professionals who need an alternative to Myers-Briggs with full data sovereignty.

**Repository**: https://github.com/guthdx/dna-spectrum
**Port**: 3001 (dev server)
**Deployment**: Self-hosted on 192.168.11.20 via NetBird VPN

## Development Commands

```bash
# Start development server (runs on port 3001)
npm run dev

# Type check without building
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Run production server
npm start
```

**Note**: This project uses port 3001 (not the default 3000) to avoid conflicts.

## Architecture & Data Flow

### Assessment Pipeline

The assessment follows a strict pipeline from questions → scoring → profile → interpretation → PDF:

```
User Input (30 questions, 1-5 scale)
    ↓
lib/scoring.ts: calculateArchetypeScores()
    → Groups responses by archetype
    → Averages 5 questions per archetype
    → Returns 6 scores (1-5 scale)
    ↓
lib/scoring.ts: calculateDualStateProfile()
    → Dominance = (Competitive + Disruptive) / 2 * 2.5 → 0-10 scale
    → Adaptiveness = (Adaptive + Relational) / 2 * 2.5 → 0-10 scale
    → isDualState = both >= 3.5 AND within 0.5 of each other
    → Returns profile type + top archetypes
    ↓
lib/profiles.ts: generateInterpretation()
    → Matches profile to predefined interpretations
    → Returns behavioral signature, strengths, watch-outs, guidance
    ↓
app/api/assessment/submit/route.ts
    → Saves to PostgreSQL (graceful fallback to sessionStorage)
    → Returns complete AssessmentResult
    ↓
app/results/[id]/page.tsx
    → Displays scores, profile, interpretation
    ↓
app/api/pdf/generate/route.ts
    → @react-pdf/renderer with createElement() (NOT JSX in .ts files)
    → Returns PDF blob for download
```

### Critical Scoring Logic

**DO NOT MODIFY** the scoring formulas without understanding the framework:

1. **Archetype Scores**: Average of 5 questions per archetype (see lib/questions.ts for mappings)
2. **Dual State Conversion**: `(score - 1) * 2.5` converts 1-5 scale to 0-10 scale
3. **Dual State Detection**: Both scores >= 3.5 AND difference <= 0.5

**Question-to-Archetype Mapping** (lib/questions.ts):
- Competitive Drivers (Ram/Eagle): Q1, 5, 9, 25, 28
- Adaptive Movers (Antelope): Q3, 7, 20, 26, 27
- Disruptive Innovators (Coyote): Q13, 14, 16, 22, 24
- Relational Harmonizers (Deer): Q2, 15, 17, 19, 21
- Grounded Protectors (Buffalo/Bear): Q11, 18, 23, 29, 30
- Structured Strategists (Owl/Fox): Q4, 6, 8, 10, 12

### Database Strategy

**Graceful Degradation Pattern**: The app works with or without a database connection.

```typescript
// app/api/assessment/submit/route.ts
try {
  await saveAssessment(result);
  console.log(`✅ Assessment saved to database: ${assessmentId}`);
} catch (dbError) {
  console.error('⚠️  Database save failed, continuing without persistence:', dbError);
  // App continues - result still returned to client
}
```

**Connection Pool** (lib/db.ts):
- Max 20 connections
- 2-second connection timeout
- 30-second idle timeout
- SSL enabled in production only

**Data Storage**:
- Primary: PostgreSQL with JSONB columns for flexibility
- Fallback: sessionStorage on client (survives page refresh, not browser close)
- Tables: `coaches`, `assessments`, `reports`

### PDF Generation

**CRITICAL**: The PDF generation route must be a `.tsx` file to use JSX syntax:

```typescript
// ✅ CORRECT - app/api/pdf/generate/route.tsx (note .tsx extension)
const stream = await renderToStream(
  <AssessmentPDFDocument result={result} />
);

// Stream handling requires Buffer type conversion
const chunks: Buffer[] = [];
for await (const chunk of stream) {
  chunks.push(Buffer.from(chunk));  // Explicit Buffer conversion
}
const buffer = Buffer.concat(chunks);
```

**Important Type Issues**:
- Route file must be `.tsx` (not `.ts`) to allow JSX
- Stream chunks need `Buffer.from()` conversion
- Use `React.ReactNode` (not `React.Node`) in layout files

**PDF Structure** (components/PDFTemplate.tsx):
- Page 1: Header + Archetype Scores + Dual State Scales
- Page 2: Core Instinct + Behavioral Signature
- Page 3: Strengths + Watch Outs + Dual State Cue
- Page 4: Leadership Guidance (Self & Others)

## Type System

All types are centralized in `types/index.ts`. Key interfaces:

**AssessmentResult** - The complete result object:
```typescript
{
  id: string;                          // UUID
  clientName?: string;
  responses: AssessmentResponse[];     // 30 questions
  scores: ArchetypeScores;             // 6 averages
  profile: DualStateProfile;           // Dominance + Adaptiveness
  interpretation: Interpretation;      // Generated text
  completedAt: Date;
}
```

**ArchetypeScores** - Always 1-5 scale:
```typescript
{
  competitiveDrivers: number;
  adaptiveMovers: number;
  disruptiveInnovators: number;
  relationalHarmonizers: number;
  groundedProtectors: number;
  structuredStrategists: number;
}
```

**DualStateProfile** - Always 0-10 scale:
```typescript
{
  profileName: string;                 // e.g., "Adaptive Driver"
  dominanceScore: number;              // 0-10
  adaptivenessScore: number;           // 0-10
  primaryArchetypes: string[];         // Top 2-3
  secondaryArchetypes: string[];
  isDualState: boolean;                // >= 3.5 and within 0.5
}
```

## Common Patterns

### Adding New Profile Interpretations

Edit `lib/profiles.ts` and add a new case in `getProfileInterpretation()`:

```typescript
if (profileName === 'Your New Profile') {
  return {
    coreInstinct: '...',
    behavioralSignature: ['...', '...'],
    strengths: ['...'],
    watchOuts: ['...'],
    dualStateCue: '...',  // Optional coaching tip
    toLeadYourself: ['...'],
    toPartnerWithOthers: ['...'],
  };
}
```

### Testing Database Queries

Use the PostgreSQL client via NetBird VPN:

```bash
# Connect to database
psql postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum

# View recent assessments
SELECT id, client_name, created_at FROM assessments ORDER BY created_at DESC LIMIT 10;

# Check profile distribution
SELECT profile_data->>'profileName' as profile, COUNT(*)
FROM assessments
GROUP BY profile_data->>'profileName';
```

### Modifying Questions

Questions are in `lib/questions.ts`. Each question MUST map to exactly one archetype:

```typescript
{
  id: 31,                              // Sequential ID
  text: "Your question text here",
  category: 'instinct',                // Display grouping only
  archetype: 'competitiveDrivers',     // Maps to scoring
}
```

After adding questions, update `QUESTION_ARCHETYPE_MAP` at the bottom of the file.

## Deployment Architecture

**Production Setup** (deployed Dec 2024):
- **Production**: Ubuntu server at 192.168.11.20, PM2 managed, port 3001
- **Public URL**: https://dna.iyeska.net (via Cloudflare tunnel)
- **Database**: PostgreSQL 16 in Docker (dna-spectrum-db)
- **Network**: NetBird VPN (self-hosted WireGuard)
- **Dev**: macOS (localhost:3001)

**Environment Variables**:

Development (`.env`):
```env
DATABASE_URL=postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum
NEXT_PUBLIC_APP_URL=http://localhost:3001
PORT=3001
NODE_ENV=development
```

Production (`.env.local` on server):
```env
DATABASE_URL=postgresql://postgres:dna_spectrum_2024@localhost:5432/dna_spectrum
NEXT_PUBLIC_APP_URL=https://dna.iyeska.net
PORT=3001
NODE_ENV=production
```

**Production Deployment**:
```bash
# On 192.168.11.20
cd ~/dna-spectrum-app
./scripts/deploy-nextjs.sh  # Automated deployment

# PM2 process management
pm2 logs dna-spectrum      # View logs
pm2 restart dna-spectrum   # Restart app
pm2 monit                  # Monitor resources
pm2 status                 # Check all processes
```

**Database Container**:
```bash
# On 192.168.11.20
cd ~/dna-spectrum
docker compose ps
docker compose logs -f postgres

# Check database directly
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c "\dt"
```

## Known Issues & Solutions

### Build Error: JSX Syntax Errors

**Cause**: Using JSX syntax in `.ts` files (only allowed in `.tsx`)

**Fix**: Rename file to `.tsx`:
```bash
mv app/api/pdf/generate/route.ts app/api/pdf/generate/route.tsx
```

**Common JSX/TypeScript Errors**:
- `React.Node` → Use `React.ReactNode` instead
- Unescaped quotes in JSX → Use HTML entities (`&ldquo;` `&rdquo;`)
- `Uint8Array[]` for stream chunks → Use `Buffer[]` with `Buffer.from()`

### Database Connection Refused

**Cause**: PostgreSQL not running or NetBird VPN disconnected

**Fix**:
```bash
# Test VPN
ping 192.168.11.20

# Check database
ssh guthdx@192.168.11.20 "docker ps | grep dna-spectrum-db"

# Restart database
ssh guthdx@192.168.11.20 "cd ~/dna-spectrum && docker compose restart postgres"
```

### Assessment Results Not Persisting

**Expected Behavior**: App logs either:
- `✅ Assessment saved to database: [UUID]` - Success
- `⚠️ Database save failed, continuing without persistence` - Fallback mode

Results still work via sessionStorage even if database save fails.

## Documentation Files

- **README.md** - Public-facing project overview
- **CLAUDE.md** - This file (architecture for Claude Code)
- **DATABASE_SETUP.md** - Complete database setup guide with troubleshooting
- **DEPLOYMENT.md** - Production deployment guide and PM2 management
- **INFRASTRUCTURE.md** - Server infrastructure and automation (created by Ubuntu Claude)
- **QUICK_REFERENCE.md** - Quick command reference guide
- **docs/*.pdf** - Original H2 framework PDFs (reference material)

## Deployment Scripts (scripts/)

Created and maintained by Ubuntu Claude for production automation:

- **deploy-nextjs.sh** - Automated production deployment (builds, PM2, Cloudflare)
- **backup-database.sh** - Daily database backups (30-day retention)
- **health-check.sh** - System health monitoring
- **restore-database.sh** - Database restore from backup
- **setup-cron.sh** - Automated task scheduling
- **dna-spectrum-app.service** - Systemd service for Next.js
- **dna-spectrum-db.service** - Systemd service for PostgreSQL

## Next.js 14 Specifics

**App Router**: Uses Next.js 14 App Router (not Pages Router)

**Route Handlers**: API routes in `app/api/*/route.ts`

**Server Components**: Default unless marked with `'use client'`

**Params Handling**: In Next.js 14.2+, params are async:
```typescript
// Route handlers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Must await
}

// Pages (client components)
const params = useParams();      // Hook, not async
const id = params.id as string;
```

## Testing & Verification

**Manual Test Flow**:
1. `npm run dev` → http://localhost:3001
2. Take assessment (30 questions)
3. Submit → redirects to `/results/[id]`
4. Verify scores, profile, interpretation displayed
5. Download PDF → should generate 4-page report
6. Check database: `SELECT * FROM assessments ORDER BY created_at DESC LIMIT 1;`

**Type Checking**:
```bash
npm run type-check  # Should exit with 0 errors
```

**Production Build**:
```bash
npm run build  # Must succeed before deployment
```

---

**Last Updated**: December 2024
**Maintained By**: Iyeska LLC
**Framework Source**: H2 Leadership DNA Spectrum
