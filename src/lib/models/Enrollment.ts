import mongoose, { Schema, Document } from 'mongoose'
import { Enrollment as IEnrollment, LessonProgress as ILessonProgress } from '@/types'

// Lesson Progress Schema
const lessonProgressSchema = new Schema<ILessonProgress & Document>({
  enrollmentId: {
    type: String,
    required: true,
  },
  lessonId: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  completedAt: {
    type: Date,
    validate: {
      validator: function(this: ILessonProgress & Document) {
        // If completed, completedAt should be set
        if (this.isCompleted && !this.completedAt) {
          this.completedAt = new Date()
        }
        return true
      }
    }
  },
}, {
  timestamps: true,
})

// Enrollment Schema
const enrollmentSchema = new Schema<IEnrollment & Document>({
  studentId: {
    type: String,
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  progress: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  completedAt: {
    type: Date,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Virtual relationships
enrollmentSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
})

enrollmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
})

enrollmentSchema.virtual('progressTracking', {
  ref: 'LessonProgress',
  localField: '_id',
  foreignField: 'enrollmentId',
})

lessonProgressSchema.virtual('enrollment', {
  ref: 'Enrollment',
  localField: 'enrollmentId',
  foreignField: '_id',
  justOne: true,
})

lessonProgressSchema.virtual('lesson', {
  ref: 'Lesson',
  localField: 'lessonId',
  foreignField: '_id',
  justOne: true,
})

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { virtuals: true })
enrollmentSchema.set('toObject', { virtuals: true })
lessonProgressSchema.set('toJSON', { virtuals: true })
lessonProgressSchema.set('toObject', { virtuals: true })

// Indexes for performance
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true }) // Prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1 })
enrollmentSchema.index({ courseId: 1 })
enrollmentSchema.index({ enrolledAt: -1 })
enrollmentSchema.index({ lastAccessedAt: -1 })
enrollmentSchema.index({ progress: 1 })

lessonProgressSchema.index({ enrollmentId: 1, lessonId: 1 }, { unique: true }) // Prevent duplicate progress records
lessonProgressSchema.index({ enrollmentId: 1 })
lessonProgressSchema.index({ lessonId: 1 })
lessonProgressSchema.index({ isCompleted: 1 })
lessonProgressSchema.index({ completedAt: -1 })

// Compound indexes for common queries
enrollmentSchema.index({ studentId: 1, progress: 1 })
enrollmentSchema.index({ courseId: 1, enrolledAt: -1 })
lessonProgressSchema.index({ enrollmentId: 1, isCompleted: 1 })

// Middleware to update lastAccessedAt on enrollment updates
enrollmentSchema.pre('save', function(next) {
  if (this.isModified('progress')) {
    this.lastAccessedAt = new Date()
    
    // Set completedAt when progress reaches 100%
    if (this.progress === 100 && !this.completedAt) {
      this.completedAt = new Date()
    }
  }
  next()
})

// Middleware to set completedAt when lesson is marked as completed
lessonProgressSchema.pre('save', function(next) {
  if (this.isModified('isCompleted') && this.isCompleted && !this.completedAt) {
    this.completedAt = new Date()
  }
  next()
})

// Static method to calculate enrollment progress
enrollmentSchema.statics.calculateProgress = async function(enrollmentId: string) {
  const enrollment = await this.findById(enrollmentId).populate('course')
  if (!enrollment) return 0

  // Get all lessons for the course (both direct lessons and subcourse lessons)
  const Course = mongoose.model('Course')
  const Lesson = mongoose.model('Lesson')
  const LessonProgress = mongoose.model('LessonProgress')
  
  const course = await Course.findById(enrollment.courseId)
  if (!course) return 0

  // Get all lessons for this course (direct and through subcourses)
  const directLessons = await Lesson.find({ courseId: enrollment.courseId })
  const subCourses = await mongoose.model('SubCourse').find({ courseId: enrollment.courseId })
  const subCourseLessons = await Lesson.find({ 
    subCourseId: { $in: subCourses.map(sc => sc._id) } 
  })
  
  const allLessons = [...directLessons, ...subCourseLessons]
  if (allLessons.length === 0) return 0

  // Get completed lessons for this enrollment
  const completedLessons = await LessonProgress.find({
    enrollmentId: enrollmentId,
    lessonId: { $in: allLessons.map(l => l._id) },
    isCompleted: true
  })

  const progress = Math.round((completedLessons.length / allLessons.length) * 100)
  
  // Update the enrollment progress
  await this.findByIdAndUpdate(enrollmentId, { 
    progress,
    ...(progress === 100 && !enrollment.completedAt ? { completedAt: new Date() } : {})
  })

  return progress
}

export const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment & Document>('Enrollment', enrollmentSchema)
export const LessonProgress = mongoose.models.LessonProgress || mongoose.model<ILessonProgress & Document>('LessonProgress', lessonProgressSchema)