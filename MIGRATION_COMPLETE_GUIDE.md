# MongoDB to PostgreSQL Migration - Completion Guide

## ✅ Completed Tasks

### 1. Core Infrastructure

- [x] Prisma schema configured with PostgreSQL (`prisma/schema.prisma`)
- [x] Prisma client singleton created (`src/lib/prisma.ts`)
- [x] Service utilities created:
  - `src/lib/services/user.service.ts` - Password hashing, user CRUD
  - `src/lib/services/enrollment.service.ts` - Progress calculation, enrollment management

### 2. Configuration & Setup

- [x] `.env.example` updated with `DATABASE_URL` for PostgreSQL
- [x] Seed script updated (`scripts/seed.ts`) - uses Prisma
- [x] Test setup updated (`src/test/setup.ts`) - uses Prisma

### 3. Cleanup

- [x] Deleted Mongoose model files:
  - `src/lib/models/User.ts`
  - `src/lib/models/Course.ts`
  - `src/lib/models/Enrollment.ts`
  - `src/lib/models/Organization.ts`
  - `src/lib/models/Quiz.ts`

### 4. API Routes Updated

- [x] `src/app/api/courses/route.ts`
- [x] `src/app/api/courses/[id]/route.ts`

## 🔄 Remaining Work

### API Routes to Update (7 files)

These files still import Mongoose models and use `connectDB()`:

1. **`src/app/api/courses/[id]/enroll/route.ts`**

   - Replace `Course` and `Enrollment` imports with Prisma
   - Remove `connectDB()` calls
   - Update queries to Prisma syntax

2. **`src/app/api/users/[id]/route.ts`**

   - Replace `User` model with Prisma
   - Update all CRUD operations

3. **`src/app/api/users/[id]/profile/route.ts`**

   - Replace `UserProfile` model with Prisma
   - Update profile queries

4. **`src/app/api/organizations/route.ts`**

   - Replace `Organization` and `OrganizationMembership` models
   - Update all organization queries

5. **`src/app/api/organizations/[organizationId]/members/route.ts`**

   - Update member management queries
   - Remove Mongoose `Types` import

6. **`src/app/api/quizzes/route.ts`**
   - Replace `Quiz` model with Prisma
   - Update quiz queries

### Server Actions to Update (1 file)

7. **`src/lib/actions/courses.ts`**
   - Replace all Mongoose model imports
   - Update all course actions

### Page Components to Update (4 files)

8. **`src/app/dashboard/page.tsx`**
9. **`src/app/dashboard/courses/page.tsx`**
10. **`src/app/dashboard/courses/[id]/edit/page.tsx`**
11. **`src/app/courses/[id]/page.tsx`**

### Test Files to Update (5 files)

12. **`src/test/api/courses.test.ts`**
13. **`src/test/api/users.test.ts`**
14. **`src/test/models/Course.test.ts`**
15. **`src/test/models/Enrollment.test.ts`**
16. **`src/test/models/Quiz.test.ts`**

## 📝 Migration Pattern Reference

### Common Mongoose → Prisma Conversions

#### Find One

```typescript
// Mongoose
const user = await User.findById(id).lean();

// Prisma
const user = await prisma.user.findUnique({
  where: { id },
});
```

#### Find Many with Filter

```typescript
// Mongoose
const courses = await Course.find({ isPublished: true })
  .populate("lecturer")
  .sort({ createdAt: -1 })
  .limit(10);

// Prisma
const courses = await prisma.course.findMany({
  where: { isPublished: true },
  include: { lecturer: true },
  orderBy: { createdAt: "desc" },
  take: 10,
});
```

#### Create

```typescript
// Mongoose
const course = await Course.create({ title, description });

// Prisma
const course = await prisma.course.create({
  data: { title, description, organizationId },
});
```

#### Update

```typescript
// Mongoose
const updated = await Course.findByIdAndUpdate(id, data, { new: true });

// Prisma
const updated = await prisma.course.update({
  where: { id },
  data,
});
```

#### Delete

```typescript
// Mongoose
await Course.findByIdAndDelete(id);

// Prisma
await prisma.course.delete({
  where: { id },
});
```

#### Count

```typescript
// Mongoose
const count = await Course.countDocuments({ isPublished: true });

// Prisma
const count = await prisma.course.count({
  where: { isPublished: true },
});
```

#### Text Search

```typescript
// Mongoose
query.$text = { $search: searchTerm };

// Prisma
where.OR = [
  { title: { contains: searchTerm, mode: "insensitive" } },
  { description: { contains: searchTerm, mode: "insensitive" } },
];
```

#### Array Contains

```typescript
// Mongoose
query.tags = { $in: ["tag1", "tag2"] };

// Prisma
where.tags = { hasSome: ["tag1", "tag2"] };
```

## 🚀 Next Steps

### 1. Update Remaining Files

Continue updating the remaining API routes, server actions, and components using the patterns above.

### 2. Setup Database

```bash
# Create .env.local with your DATABASE_URL
cp .env.example .env.local

# Edit .env.local and set:
DATABASE_URL="postgresql://username:password@localhost:5432/lms-platform"

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 3. Seed Database

```bash
npm run seed
```

### 4. Test Application

```bash
# Run development server
npm run dev

# Run tests
npm test
```

### 5. Common Issues & Solutions

**Issue**: `organizationId` required but not provided
**Solution**: Ensure users belong to an organization before creating courses/content

**Issue**: Unique constraint violations
**Solution**: Check Prisma schema for `@@unique` constraints

**Issue**: Foreign key constraints
**Solution**: Delete child records before parent records (or use cascade deletes in schema)

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## ⚠️ Important Notes

1. **OrganizationId Required**: Most models now require an `organizationId`. Ensure this is provided when creating records.

2. **ID Format**: Prisma uses `cuid()` by default instead of MongoDB ObjectIds. Existing code expecting ObjectId format may need updates.

3. **Cascading Deletes**: Configured in Prisma schema with `onDelete: Cascade`. Review these carefully.

4. **Transactions**: Use Prisma transactions for operations that need atomicity:

   ```typescript
   await prisma.$transaction([
     prisma.course.create({...}),
     prisma.enrollment.create({...})
   ])
   ```

5. **Better Auth Integration**: The auth system is already configured to work with PostgreSQL. User creation is handled by Better Auth with Prisma sync in callbacks.
