# Shop-Shop Delivery Platform

A modern, full-stack delivery platform built with TypeScript, featuring real-time order tracking, vendor management, and comprehensive e-commerce functionality.

## 🚀 Overview

Shop-Shop is a sophisticated delivery platform that connects customers with local vendors, providing seamless order management, real-time tracking, payment processing, and vendor verification. The platform is built as a monorepo using pnpm workspaces, ensuring type safety and code sharing across all packages.

## 📁 Project Structure

```
shop-shop/
├── apps/
│   ├── server/          # Fastify backend API
│   └── web/             # React frontend application
├── packages/
│   ├── db/              # Prisma database layer and services
│   ├── domain/          # Business logic and domain models
│   ├── schemas/         # Zod schemas and type definitions
│   ├── sdk/             # Auto-generated client SDK
│   ├── openapi/         # OpenAPI specification generation
│   └── realtime/        # WebSocket real-time communication
├── docs/                # Technical documentation
└── scripts/             # Build and utility scripts
```

## 🛠️ Technology Stack

### Backend (Server)
- **Framework**: Fastify with TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3 (configurable local storage)
- **Payment**: Stripe Connect integration
- **Real-time**: WebSocket support
- **API Documentation**: OpenAPI/Swagger UI

### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest + Playwright E2E

### Development Tools
- **Package Manager**: pnpm with workspaces
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Vitest (unit), Playwright (E2E)
- **Type Safety**: End-to-end TypeScript with shared schemas

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9.0.0+
- MySQL database

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd shop-shop
   pnpm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and API keys
   ```

3. **Database setup**
   ```bash
   pnpm fresh    # Reset, migrate, and generate. Reset also runs the seed
   pnpm db:seed  # Reseed users, stores, customers, products, and activity
   # Or for first-time setup:
   pnpm start:local  # Complete setup and start both services
   ```

4. **Start development servers**
   ```bash
   pnpm dev  # Starts both server and web in parallel
   # Or use the complete setup command:
   pnpm start:local  # Setup + start everything
   ```

The application will be available at:
- Frontend: http://localhost:5177
- Backend API: http://localhost:3005
- API Docs: http://localhost:3005/docs

## 📋 Available Scripts

### Development
- `pnpm dev` - Start both server and web in development mode
- `pnpm start:local` - Complete setup and start both services
- `pnpm dev:server` - Start only the backend server
- `pnpm dev:web` - Start only the frontend application

### Production
- `pnpm build` - Build all packages for production
- `pnpm start` - Start production servers (build required)
- `pnpm start:prod` - Start production servers with preview

### Database Management
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:reset` - Reset database to clean state
- `pnpm db:seed` - Replace seed data (reads `DATABASE_URL` from `packages/db/.env`)

### Code Generation
- `pnpm gen:all` - Generate DTOs, OpenAPI specs, and SDK
- `pnpm gen:full` - Full generation including client SDKs
- `pnpm gen:sdk` - Generate client SDK only
- `pnpm gen:openapi` - Generate OpenAPI specification

### Quality Assurance
- `pnpm check` - Run linting, type checking, and tests
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages
- `pnpm test` - Run all unit tests
- `pnpm e2e` - Run end-to-end tests

## 🌱 Seed data

`pnpm db:seed` clears seed-owned tables, then loads tags, accounts, the Austin catalog, orders and River activity, and the geocoding cache. The Austin catalog is deterministic. Every account uses the password `Test123456!`.

The seed refuses any non-local database unless `SEED_ALLOW_REMOTE_HOST` names that host and `SEED_PASSWORD` is set to at least 16 characters. Seeded accounts then use that password instead of the default. `enhanced-seed.ts` and the standalone `seed-austin-stores.ts` follow the same rule, while `prune-to-main-stores.ts`, `seed-store-locations.ts` and `backfill-seed-images.ts` need only `SEED_ALLOW_REMOTE_HOST`.

Against a deployed database, also set `UPLOAD_BASE_URL` to the API's `/uploads` URL so photo links point at the API host. Seed photos live on the `server` volume under `seed/`; if the volume is new, copy them from `apps/web/public/editorial`:

```bash
tar -C apps/web/public/editorial -cf - --exclude=manifest.json . | railway ssh --service server -- sh -c 'mkdir -p /app/uploads/seed && tar -xf - -C /app/uploads/seed'
```

| Email | Role |
| --- | --- |
| `admin@seed.local` | Admin |
| `admin2@seed.local` | Admin |
| `staff@seed.local` | Staff |
| `customer@seed.local` | Customer |
| `maya.chen@seed.local` | Customer, referred by `AFFILIATE2024` |
| `jordan.lee@seed.local` | Customer |
| `sam.patel@seed.local` | Customer |
| `riley.nguyen@seed.local` | Customer |
| `alex.brooks@seed.local` | Customer |
| `vendor@seed.local` | Vendor, owns Seed Bistro North and South |
| `vendor-pending@seed.local` | Vendor, pending approval |
| `affiliate@seed.local` | Affiliate, active (`AFFILIATE2024`) |
| `affiliate-pending@seed.local` | Affiliate, pending (`AFFILIATE2025`) |
| `rider@seed.local` | Rider |
| `vendor-{store-slug}@test.com` | Vendor for one Austin store |

Customers have a home address and a test card. Activity includes orders across checkout states, an open cart, an abandoned cart, favorites, and River likes, comments, saves, and seen posts. The official Shop Shop store is included for River editorial posts.

## 🏗️ Core Features

### Customer Experience
- **Browse & Search**: Discover local vendors and products
- **Real-time Tracking**: Live order status updates via WebSocket
- **Secure Payments**: Stripe integration with multiple payment methods
- **Order History**: Complete order management and reordering
- **Favorites**: Save preferred vendors and items for quick access

### Vendor Management
- **Store Setup**: Complete vendor onboarding and profile management
- **Product Catalog**: Easy product and menu management
- **Order Processing**: Streamlined order fulfillment workflow
- **Analytics Dashboard**: Sales insights and performance metrics
- **Payout Management**: Automated payment processing via Stripe Connect

### Platform Features
- **Geolocation**: Advanced delivery zone mapping with polygon support
- **Real-time Communication**: WebSocket-based live updates
- **Media Management**: Image uploads with compression and CDN support
- **Verification System**: KYC/KYB vendor verification workflow
- **Promotion Engine**: Advanced discount and coupon management
- **Team Collaboration**: Multi-user vendor accounts with role-based access

## 🔧 Architecture Highlights

### Type-Safe Full Stack
- Shared Zod schemas ensure end-to-end type safety
- Auto-generated client SDK from backend schemas
- Consistent data validation across frontend and backend

### Modular Design
- Clean separation of concerns with domain-driven design
- Reusable packages for database, schemas, and utilities
- Plugin-based architecture for easy feature extension

### Performance Optimized
- Efficient database queries with Prisma optimizations
- Real-time updates without polling
- Optimized bundle sizes with code splitting

### Developer Experience
- Hot reload for rapid development
- Comprehensive testing setup
- Automated code generation to reduce boilerplate
- Extensive documentation and type hints

## 📚 API Documentation

Once the server is running, visit http://localhost:3005/docs for interactive API documentation powered by Swagger UI.

## 🧪 Testing

The project includes comprehensive testing at multiple levels:

- **Unit Tests**: Vitest for business logic and utilities
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for full user journey testing
- **Type Tests**: Automated type safety validation

Run tests with:
```bash
pnpm test          # All unit tests
pnpm test:e2e      # End-to-end tests
pnpm test:coverage # Coverage reports
```

## 🔒 Security Features

- JWT-based authentication with secure token handling
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration for cross-origin requests
- File upload security with size and type restrictions
- Environment variable management for sensitive data

## 🌍 Environment Variables

Key environment variables (see `.env.example`):

```env
DATABASE_URL=mysql://user:pass@localhost:3306/delivery_app
PORT=3005
WEB_PORT=5177
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5177
STRIPE_SECRET_KEY=sk_test_...
GEOCODING_API_KEY=your-geocoding-key
```

## 📈 Monitoring & Analytics

- Structured logging with Pino
- Performance metrics and health checks
- Error tracking and reporting
- Database query optimization
- Real-time event tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Ensure all tests pass and maintain code quality standards.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:
- Check the existing documentation in `/docs`
- Review the analysis documents for technical decisions
- Open an issue for bug reports or feature requests

---

Built with ❤️ using modern web technologies and best practices.
