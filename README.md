# H2 DNA Spectrum

> Instinct-Based Personality Assessment for Coaches and Consultants

An open-source, self-hosted alternative to Myers-Briggs that identifies natural behavioral patterns based on six core archetypes and Dual State profiles.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)

## Features

- **30-Question Assessment** - Instinct-driven behavioral profiling
- **6 Core Archetypes** - Competitive Drivers, Adaptive Movers, Disruptive Innovators, Relational Harmonizers, Grounded Protectors, Structured Strategists
- **Dual State Analysis** - Dominance vs Adaptiveness balance scoring
- **Professional PDF Reports** - 4-page detailed personality profiles
- **Self-Hosted** - Full data sovereignty on your infrastructure
- **Coach Platform** - Manage multiple clients and track assessments
- **Open Source** - MIT licensed, community-driven

## Quick Start

```bash
# Clone the repository
git clone https://github.com/guthdx/dna-spectrum.git
cd dna-spectrum

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Tech Stack

- **Frontend**: Next.js 14 (React + TypeScript)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **PDF Generation**: @react-pdf/renderer
- **Database**: PostgreSQL
- **Deployment**: Docker Compose (self-hosted)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐       ┌──────────────┐               │
│  │   Next.js    │──────▶│ PostgreSQL   │               │
│  │   Frontend   │       │   Database   │               │
│  │   + API      │       │              │               │
│  └──────────────┘       └──────────────┘               │
│         │                                                │
│         │ PDF Generation                                │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │ /data/pdfs/  │  (volume mount)                      │
│  └──────────────┘                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Assessment Framework

### Six Core Archetypes

| Archetype | Animal | Traits | Questions |
|-----------|--------|--------|-----------|
| **Competitive Drivers** | Ram / Eagle | Assertive, decisive, takes charge | 1, 5, 9, 25, 28 |
| **Adaptive Movers** | Antelope | Agile, thrives in change, pattern recognition | 3, 7, 20, 26, 27 |
| **Disruptive Innovators** | Coyote | Challenges norms, tests boundaries, creative | 13, 14, 16, 22, 24 |
| **Relational Harmonizers** | Deer | Empathic, peacekeeper, reads people | 2, 15, 17, 19, 21 |
| **Grounded Protectors** | Buffalo / Bear | Protective, endurance, loyal | 11, 18, 23, 29, 30 |
| **Structured Strategists** | Owl / Fox | Observant, strategic, depth-focused | 4, 6, 8, 10, 12 |

### Dual State Profiles

The assessment calculates two scales:

- **Dominance** = Average(Competitive Drivers, Disruptive Innovators) × 2.5 → 0-10 scale
- **Adaptiveness** = Average(Adaptive Movers, Relational Harmonizers) × 2.5 → 0-10 scale

Example profiles:
- **Adaptive Driver** - High in both dominance and adaptiveness (balanced)
- **Competitive Driver** - High dominance, lower adaptiveness
- **Adaptive Harmonizer** - High adaptiveness, lower dominance
- **Grounded Protector** - High protection, moderate others
- **Strategic Innovator** - High innovation + strategy

## Project Structure

```
dna-spectrum/
├── app/                    # Next.js App Router
│   ├── assessment/        # Assessment form
│   ├── results/           # Results display
│   └── api/               # API endpoints
├── components/            # React components
├── lib/
│   ├── questions.ts       # 30 questions with mappings
│   ├── scoring.ts         # Scoring algorithm
│   ├── profiles.ts        # Profile interpretations
│   └── db.ts              # PostgreSQL client
├── types/
│   └── index.ts           # TypeScript definitions
├── docs/                  # Original H2 framework PDFs
└── docker-compose.yml     # Docker deployment
```

## Database Schema

```sql
-- Coaches/Consultants
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Assessments
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  responses JSONB NOT NULL,
  scores JSONB,
  profile_data JSONB,
  share_token TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Docker Compose (Recommended)

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/dna_spectrum
NEXT_PUBLIC_APP_URL=https://dna.yourdomain.com
```

## Roadmap

### Phase 1: MVP (Current)
- [x] 30-question assessment
- [x] Scoring algorithm
- [x] TypeScript types and interfaces
- [ ] Assessment form UI
- [ ] Results display page
- [ ] PDF report generation

### Phase 2: Coach Platform
- [ ] Authentication (NextAuth.js)
- [ ] Coach dashboard
- [ ] Client management
- [ ] Shareable assessment links
- [ ] Email delivery integration

### Phase 3: Advanced Features
- [ ] Team composition analysis
- [ ] Advanced analytics dashboard
- [ ] Custom branding options
- [ ] White-label solution
- [ ] Mobile app

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Based on the H2 DNA Spectrum framework by H2 Leadership. This is an independent, open-source implementation for educational and coaching purposes.

## Support

- **Issues**: [GitHub Issues](https://github.com/guthdx/dna-spectrum/issues)
- **Discussions**: [GitHub Discussions](https://github.com/guthdx/dna-spectrum/discussions)
- **Email**: support@iyeska.net

---

**Developed by [Iyeska LLC](https://iyeska.net)** - Tribal-focused technology services with a commitment to data sovereignty and self-hosting.
