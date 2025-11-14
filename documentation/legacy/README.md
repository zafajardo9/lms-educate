# Legacy Documentation

> **⚠️ ARCHIVED**: These files contain outdated patterns and are kept for historical reference only.

## Why These Files Are Here

These documentation files have been archived because they contain:

- **Mongoose patterns** (we now use Prisma)
- **MongoDB examples** (we now use PostgreSQL)
- **Outdated architecture** (partially updated)
- **Mixed patterns** (inconsistent with current codebase)

## Current Documentation

For up-to-date documentation, see:

### **[../CONSOLIDATED_GUIDE.md](../CONSOLIDATED_GUIDE.md)** ⭐

**Single source of truth** with all current patterns, standards, and examples.

### **[../api/API_REFERENCE.md](../api/API_REFERENCE.md)**

Complete API documentation with Prisma examples.

---

## Archived Files

### API_PATTERNS.md 🗂️

- **Status**: Outdated (Mongoose)
- **Replaced by**: API_PATTERNS_PRISMA.md + CONSOLIDATED_GUIDE.md
- **Reason**: Contains Mongoose query patterns

### DATABASE_PATTERNS.md 🗂️

- **Status**: Outdated (Mongoose)
- **Replaced by**: CONSOLIDATED_GUIDE.md (Database & Prisma section)
- **Reason**: All examples use Mongoose instead of Prisma

### DATA_FETCHING_PATTERNS.md 🗂️

- **Status**: Needs update
- **Replaced by**: CONSOLIDATED_GUIDE.md (Component Patterns section)
- **Reason**: Contains Mongoose examples, needs Prisma update

### ARCHITECTURE.md 🗂️

- **Status**: Partially outdated
- **Replaced by**: CONSOLIDATED_GUIDE.md (Architecture Overview section)
- **Reason**: Mixed Mongoose/Prisma references

### CODING_STANDARDS.md 🗂️

- **Status**: Partially outdated
- **Replaced by**: CONSOLIDATED_GUIDE.md (Coding Standards section)
- **Reason**: Contains Mongoose examples

---

## Migration Notes

**From**: MongoDB + Mongoose  
**To**: PostgreSQL + Prisma  
**Date**: November 2024  
**Status**: Complete ✅

All active code now uses:

- PostgreSQL database
- Prisma ORM
- Better Auth
- Type-safe queries
- Organization scoping

---

## Do Not Use These Files

❌ Do not reference these files for new development  
❌ Do not copy patterns from these files  
❌ Do not update these files

✅ Use CONSOLIDATED_GUIDE.md instead  
✅ Use API_REFERENCE.md for API patterns  
✅ Use current codebase as examples

---

**If you need historical context**, these files are preserved here. Otherwise, use the current documentation.
