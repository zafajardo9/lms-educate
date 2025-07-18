import mongoose, { Schema, Document } from 'mongoose'
import { Course as ICourse, SubCourse as ISubCourse, Lesson as ILesson, CourseLevel } from '@/types'

// Lesson Schema
const lessonSchema = new Schema<ILesson & Document>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true
        // Basic URL validation
        return /^https?:\/\/.+/.test(v)
      },
      message: 'Invalid video URL format'
    }
  },
  attachments: [{
    type: String,
    validate: {
      validator: function(v: string) {
        // Basic URL validation for attachments
        return /^https?:\/\/.+/.test(v)
      },
      message: 'Invalid attachment URL format'
    }
  }],
  courseId: {
    type: String,
  },
  subCourseId: {
    type: String,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
  duration: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v: number) {
        return v === undefined || v >= 0
      },
      message: 'Duration must be a positive number'
    }
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

// SubCourse Schema
const subCourseSchema = new Schema<ISubCourse & Document>({
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
  courseId: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

// Course Schema
const courseSchema = new Schema<ICourse & Document>({
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
  lecturerId: {
    type: String,
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  thumbnail: {
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true
        return /^https?:\/\/.+/.test(v)
      },
      message: 'Invalid thumbnail URL format'
    }
  },
  price: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v: number) {
        return v === undefined || v >= 0
      },
      message: 'Price must be a positive number'
    }
  },
  duration: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v: number) {
        return v === undefined || v >= 0
      },
      message: 'Duration must be a positive number'
    }
  },
  level: {
    type: String,
    enum: Object.values(CourseLevel),
    required: true,
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],
}, {
  timestamps: true,
})

// Virtual relationships
courseSchema.virtual('lecturer', {
  ref: 'User',
  localField: 'lecturerId',
  foreignField: '_id',
  justOne: true,
})

courseSchema.virtual('subCourses', {
  ref: 'SubCourse',
  localField: '_id',
  foreignField: 'courseId',
})

courseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'courseId',
})

courseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'courseId',
})

courseSchema.virtual('quizzes', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'courseId',
})

subCourseSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
})

subCourseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'subCourseId',
})

lessonSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
})

lessonSchema.virtual('subCourse', {
  ref: 'SubCourse',
  localField: 'subCourseId',
  foreignField: '_id',
  justOne: true,
})

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true })
courseSchema.set('toObject', { virtuals: true })
subCourseSchema.set('toJSON', { virtuals: true })
subCourseSchema.set('toObject', { virtuals: true })
lessonSchema.set('toJSON', { virtuals: true })
lessonSchema.set('toObject', { virtuals: true })

// Indexes for performance
courseSchema.index({ lecturerId: 1 })
courseSchema.index({ isPublished: 1 })
courseSchema.index({ level: 1 })
courseSchema.index({ category: 1 })
courseSchema.index({ tags: 1 })
courseSchema.index({ createdAt: -1 })
courseSchema.index({ title: 'text', description: 'text' })

subCourseSchema.index({ courseId: 1, order: 1 })
subCourseSchema.index({ isPublished: 1 })

lessonSchema.index({ courseId: 1, order: 1 })
lessonSchema.index({ subCourseId: 1, order: 1 })
lessonSchema.index({ isPublished: 1 })

// Compound indexes for common queries
courseSchema.index({ lecturerId: 1, isPublished: 1 })
courseSchema.index({ level: 1, isPublished: 1 })

// Validation middleware for lessons
lessonSchema.pre('save', function(next) {
  // Either courseId or subCourseId must be present, but not both
  const hasCourseId = !!this.courseId
  const hasSubCourseId = !!this.subCourseId
  
  if (hasCourseId === hasSubCourseId) {
    return next(new Error('Lesson must belong to either a course or subcourse, but not both'))
  }
  
  next()
})

export const Course = mongoose.models.Course || mongoose.model<ICourse & Document>('Course', courseSchema)
export const SubCourse = mongoose.models.SubCourse || mongoose.model<ISubCourse & Document>('SubCourse', subCourseSchema)
export const Lesson = mongoose.models.Lesson || mongoose.model<ILesson & Document>('Lesson', lessonSchema)