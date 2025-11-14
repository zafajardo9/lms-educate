# LMS Platform Documentation

Welcome to the LMS Platform documentation. This documentation serves as a comprehensive guide for understanding, building, and maintaining the system.

## 📚 Documentation Index

### Core Architecture
- **[Architecture](./ARCHITECTURE.md)** - System architecture, principles, tech stack, and project structure
- **[Coding Standards](./CODING_STANDARDS.md)** - TypeScript conventions, naming, file organization, and best practices

### Development Patterns
- **[Data Fetching Patterns](./DATA_FETCHING_PATTERNS.md)** - When and how to use Server Components, Server Actions, API Routes, and Client Components
- **[Authentication Patterns](./AUTHENTICATION_PATTERNS.md)** - Authentication flow, authorization layers, and security best practices
- **[Database Patterns](./DATABASE_PATTERNS.md)** - Mongoose patterns, queries, mutations, and data serialization
- **[API Patterns](./API_PATTERNS.md)** - API route structure, validation, error handling, and response formats
- **[Component Patterns](./COMPONENT_PATTERNS.md)** - Server and Client component patterns, forms, modals, and UI components

### API Documentation
- **[API Documentation](./api/README.md)** - API overview and quick links
- **[Implemented APIs](./api/IMPLEMENTED_APIS.md)** - Currently implemented APIs
- **[Suggested APIs](./api/SUGGESTED_APIS.md)** - Recommended APIs to implement based on database schema

## 🚀 Quick Start

1. **Read Architecture** - Understand the overall system design
2. **Review Coding Standards** - Learn the coding conventions
3. **Study Data Fetching Patterns** - Understand when to use each pattern
4. **Reference Specific Patterns** - Use the pattern docs as you build features

## 🎯 Key Principles

1. **Server-First**: Prefer Server Components and Server Actions
2. **Type Safety**: Use TypeScript throughout
3. **Role-Based Access Control**: Multi-layered authorization
4. **Data Isolation**: Organization-scoped data
5. **Progressive Enhancement**: Client components only when needed

## 📖 How to Use This Documentation

### For New Developers
1. Start with [Architecture](./ARCHITECTURE.md) to understand the system
2. Read [Coding Standards](./CODING_STANDARDS.md) to learn conventions
3. Study [Data Fetching Patterns](./DATA_FETCHING_PATTERNS.md) for the hybrid approach
4. Reference specific pattern docs as needed

### For Feature Development
1. Check [Data Fetching Patterns](./DATA_FETCHING_PATTERNS.md) to choose the right approach
2. Follow [API Patterns](./API_PATTERNS.md) for API routes
3. Use [Component Patterns](./COMPONENT_PATTERNS.md) for UI components
4. Ensure [Authentication Patterns](./AUTHENTICATION_PATTERNS.md) are followed
5. Apply [Database Patterns](./DATABASE_PATTERNS.md) for data operations

### For Code Reviews
- Verify adherence to [Coding Standards](./CODING_STANDARDS.md)
- Check that correct [Data Fetching Patterns](./DATA_FETCHING_PATTERNS.md) are used
- Ensure [Authentication Patterns](./AUTHENTICATION_PATTERNS.md) are followed
- Validate [Database Patterns](./DATABASE_PATTERNS.md) are applied correctly

## 🔍 Finding Information

### "How do I..."
- **Fetch data in a page?** → [Data Fetching Patterns](./DATA_FETCHING_PATTERNS.md) - Server Component Pattern
- **Create an API endpoint?** → [API Patterns](./API_PATTERNS.md)
- **Handle authentication?** → [Authentication Patterns](./AUTHENTICATION_PATTERNS.md)
- **Query the database?** → [Database Patterns](./DATABASE_PATTERNS.md)
- **Create a form?** → [Component Patterns](./COMPONENT_PATTERNS.md) - Form Component Pattern
- **Check user permissions?** → [Authentication Patterns](./AUTHENTICATION_PATTERNS.md) - Authorization Patterns

## 📝 Documentation Maintenance

This documentation should be updated when:
- New patterns are established
- Architecture changes
- New conventions are adopted
- Common issues are discovered and resolved

Keep this documentation aligned with the actual codebase to ensure it remains a reliable reference.

## 🛠️ Tech Stack Reference

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better Auth
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form

## 📞 Getting Help

When stuck:
1. Check the relevant pattern documentation
2. Review existing code that does something similar
3. Refer to the [Architecture](./ARCHITECTURE.md) for system-wide decisions
4. Check [Coding Standards](./CODING_STANDARDS.md) for conventions

---

**Last Updated**: This documentation is maintained alongside the codebase. Always refer to the latest version in the repository.

