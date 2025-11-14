# Database Patterns

> **⚠️ MIGRATION COMPLETE**: This project has been migrated from MongoDB/Mongoose to PostgreSQL/Prisma.  
> **This file contains legacy Mongoose patterns for reference only.**  
> For current Prisma patterns, see the updated examples in:
>
> - **[API_PATTERNS_PRISMA.md](./API_PATTERNS_PRISMA.md)** - Complete Prisma API patterns
> - **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Updated architecture with Prisma
> - **[DATA_FETCHING_PATTERNS.md](./DATA_FETCHING_PATTERNS.md)** - Data fetching with Prisma

---

## MongoDB with Mongoose (LEGACY - For Reference Only)

### Connection Pattern

```typescript
// src/lib/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lms-platform";

async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose; // Already connected
    }

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log("✅ Connected to MongoDB");
    return mongoose;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export default connectDB;
```

### Usage

```typescript
// Always call before database operations
await connectDB();
const courses = await Course.find({});
```

## Model Definition Pattern

### Basic Model Structure

```typescript
// src/lib/models/Course.ts
import mongoose, { Schema, Document } from "mongoose";
import { Course as ICourse, CourseLevel } from "@/types";

const courseSchema = new Schema<ICourse & Document>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    organizationId: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: Object.values(CourseLevel),
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes
courseSchema.index({ organizationId: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ organizationId: 1, isPublished: 1 }); // Compound index

// Virtual relationships
courseSchema.virtual("lecturer", {
  ref: "User",
  localField: "lecturerId",
  foreignField: "_id",
  justOne: true,
});

// Export model
export const Course =
  mongoose.models.Course ||
  mongoose.model<ICourse & Document>("Course", courseSchema);
```

### Model Best Practices

1. **Always use TypeScript types**

   ```typescript
   const courseSchema = new Schema<ICourse & Document>({ ... })
   ```

2. **Add validation in schema**

   ```typescript
   title: {
     type: String,
     required: true,
     trim: true,
     maxlength: 200,
   }
   ```

3. **Use enums for fixed values**

   ```typescript
   level: {
     type: String,
     enum: Object.values(CourseLevel),
     required: true,
   }
   ```

4. **Add indexes for frequently queried fields**

   ```typescript
   courseSchema.index({ organizationId: 1 });
   courseSchema.index({ organizationId: 1, isPublished: 1 });
   ```

5. **Use virtuals for relationships**

   ```typescript
   courseSchema.virtual("lecturer", {
     ref: "User",
     localField: "lecturerId",
     foreignField: "_id",
     justOne: true,
   });
   ```

6. **Enable virtuals in JSON**
   ```typescript
   courseSchema.set("toJSON", { virtuals: true });
   courseSchema.set("toObject", { virtuals: true });
   ```

## Query Patterns

### Pattern 1: Simple Find

```typescript
// ✅ Good: Simple query
const courses = await Course.find({ isPublished: true });
```

### Pattern 2: Find with Filters

```typescript
// ✅ Good: Query with multiple filters
const courses = await Course.find({
  organizationId: orgId,
  isPublished: true,
  level: CourseLevel.BEGINNER,
});
```

### Pattern 3: Find with Population

```typescript
// ✅ Good: Populate relationships
const courses = await Course.find({})
  .populate("lecturer", "name email")
  .populate("organization", "name slug");
```

### Pattern 4: Find with Lean (Read-Only)

```typescript
// ✅ Good: Use .lean() for read-only queries (faster)
const courses = await Course.find({}).populate("lecturer", "name email").lean();
```

### Pattern 5: Find with Sorting

```typescript
// ✅ Good: Sort results
const courses = await Course.find({})
  .sort({ createdAt: -1 }) // Newest first
  .lean();
```

### Pattern 6: Find with Pagination

```typescript
// ✅ Good: Pagination
const page = 1;
const limit = 10;
const skip = (page - 1) * limit;

const [courses, total] = await Promise.all([
  Course.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
  Course.countDocuments({}),
]);

const totalPages = Math.ceil(total / limit);
```

### Pattern 7: Find with Text Search

```typescript
// ✅ Good: Text search (requires text index)
const courses = await Course.find({
  $text: { $search: searchTerm },
})
  .sort({ score: { $meta: "textScore" } })
  .lean();
```

### Pattern 8: Find One

```typescript
// ✅ Good: Find single document
const course = await Course.findById(courseId);
if (!course) {
  throw new Error("Course not found");
}
```

### Pattern 9: Find with Select

```typescript
// ✅ Good: Select only needed fields
const courses = await Course.find({}).select("title description level").lean();
```

## Mutation Patterns

### Pattern 1: Create

```typescript
// ✅ Good: Create document
const course = await Course.create({
  title: "Introduction to Web Development",
  description: "Learn the basics",
  organizationId: orgId,
  lecturerId: userId,
  level: CourseLevel.BEGINNER,
  isPublished: false,
});
```

### Pattern 2: Update

```typescript
// ✅ Good: Update document
const course = await Course.findByIdAndUpdate(
  courseId,
  {
    title: "Updated Title",
    isPublished: true,
  },
  {
    new: true, // Return updated document
    runValidators: true, // Run schema validators
  }
);
```

### Pattern 3: Delete

```typescript
// ✅ Good: Delete document
await Course.findByIdAndDelete(courseId);
```

### Pattern 4: Delete with Checks

```typescript
// ✅ Good: Check before delete
const enrollmentCount = await Enrollment.countDocuments({ courseId });
if (enrollmentCount > 0) {
  throw new Error("Cannot delete course with active enrollments");
}
await Course.findByIdAndDelete(courseId);
```

## Data Serialization

### MongoDB Document to JSON

```typescript
// ✅ Good: Serialize dates and ObjectIds
const courses = await Course.find({}).lean();

const serializedCourses = courses.map((course) => ({
  ...course,
  id: course._id.toString(),
  createdAt: course.createdAt.toISOString(),
  updatedAt: course.updatedAt.toISOString(),
  lecturer: course.lecturer
    ? {
        ...course.lecturer,
        id: course.lecturer._id.toString(),
      }
    : null,
}));
```

### For Server Components

```typescript
export default async function CoursesPage() {
  await connectDB();
  const courses = await Course.find({})
    .populate("lecturer", "name email")
    .lean();

  // Serialize for client
  const serializedCourses = courses.map((course) => ({
    ...course,
    id: course._id.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  }));

  return <CourseList courses={serializedCourses} />;
}
```

## Organization Scoping

### Always Filter by Organization

```typescript
// ✅ Good: Always scope by organization
const courses = await Course.find({
  organizationId: session.user.organizationId,
  isPublished: true,
});
```

### Compound Indexes for Organization Queries

```typescript
// ✅ Good: Compound index for common queries
courseSchema.index({ organizationId: 1, isPublished: 1 });
courseSchema.index({ organizationId: 1, level: 1, isPublished: 1 });
```

## Indexes

### Single Field Index

```typescript
courseSchema.index({ organizationId: 1 });
courseSchema.index({ isPublished: 1 });
```

### Compound Index

```typescript
// For queries like: { organizationId: X, isPublished: true }
courseSchema.index({ organizationId: 1, isPublished: 1 });
```

### Text Index

```typescript
// For text search
courseSchema.index({ title: "text", description: "text" });
```

### Unique Index

```typescript
// For unique constraints
userSchema.index({ email: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
```

## Relationships

### Reference Pattern (One-to-Many)

```typescript
// Course has many Lessons
const lessonSchema = new Schema({
  courseId: {
    type: String,
    required: true,
  },
  // ... other fields
});

// Query with populate
const course = await Course.findById(courseId).populate("lessons");
```

### Virtual Relationships

```typescript
// Define virtual
courseSchema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "courseId",
});

// Use in query
const course = await Course.findById(courseId).populate("lessons");
```

## Validation

### Schema-Level Validation

```typescript
const courseSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  price: {
    type: Number,
    min: 0,
    validate: {
      validator: function (v: number) {
        return v === undefined || v >= 0;
      },
      message: "Price must be a positive number",
    },
  },
});
```

### Custom Validators

```typescript
videoUrl: {
  type: String,
  validate: {
    validator: function(v: string) {
      if (!v) return true
      return /^https?:\/\/.+/.test(v)
    },
    message: 'Invalid video URL format'
  }
}
```

### Pre-Save Hooks

```typescript
lessonSchema.pre("save", function (next) {
  // Either courseId or subCourseId must be present, but not both
  const hasCourseId = !!this.courseId;
  const hasSubCourseId = !!this.subCourseId;

  if (hasCourseId === hasSubCourseId) {
    return next(
      new Error(
        "Lesson must belong to either a course or subcourse, but not both"
      )
    );
  }

  next();
});
```

## Performance Tips

1. **Use `.lean()`** for read-only queries

   ```typescript
   const courses = await Course.find({}).lean();
   ```

2. **Add indexes** for frequently queried fields

   ```typescript
   courseSchema.index({ organizationId: 1, isPublished: 1 });
   ```

3. **Use `.select()`** to limit fields

   ```typescript
   const courses = await Course.find({}).select("title description level");
   ```

4. **Use `.populate()`** efficiently

   ```typescript
   // Only populate what you need
   .populate('lecturer', 'name email')
   ```

5. **Use `Promise.all()`** for parallel queries

   ```typescript
   const [courses, total] = await Promise.all([
     Course.find({}).lean(),
     Course.countDocuments({}),
   ]);
   ```

6. **Limit pagination** results

   ```typescript
   .skip(skip).limit(limit)
   ```

7. **Use compound indexes** for multi-field queries
   ```typescript
   courseSchema.index({ organizationId: 1, isPublished: 1 });
   ```

## Error Handling

### Try-Catch Pattern

```typescript
try {
  const course = await Course.create(courseData);
  return { success: true, data: course };
} catch (error) {
  if (error instanceof mongoose.Error.ValidationError) {
    return {
      success: false,
      error: "Validation failed",
      details: error.errors,
    };
  }
  return { success: false, error: error.message };
}
```

### Check Document Existence

```typescript
const course = await Course.findById(courseId);
if (!course) {
  throw new Error("Course not found");
}
```

## Common Queries

### Find by Organization

```typescript
const courses = await Course.find({ organizationId: orgId });
```

### Find Published Courses

```typescript
const courses = await Course.find({ isPublished: true });
```

### Find with Multiple Conditions

```typescript
const courses = await Course.find({
  organizationId: orgId,
  isPublished: true,
  level: CourseLevel.BEGINNER,
});
```

### Count Documents

```typescript
const count = await Course.countDocuments({ organizationId: orgId });
```

### Check Existence

```typescript
const exists = await Course.exists({ _id: courseId });
```
