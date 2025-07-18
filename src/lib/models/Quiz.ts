import mongoose, { Schema, Document } from 'mongoose'
import { Quiz as IQuiz, Question as IQuestion, QuizSubmission as IQuizSubmission, QuestionType, QuizAnswer } from '@/types'

// Quiz Answer Schema (embedded in QuizSubmission)
const quizAnswerSchema = new Schema<QuizAnswer>({
  questionId: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  pointsEarned: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false })

// Question Schema
const questionSchema = new Schema<IQuestion & Document>({
  quizId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(QuestionType),
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  options: {
    type: [String],
    validate: {
      validator: function(this: IQuestion & Document) {
        // Options are required for multiple choice questions
        if (this.type === QuestionType.MULTIPLE_CHOICE) {
          return this.options && this.options.length >= 2
        }
        // Options should be empty for other question types
        if (this.type === QuestionType.TRUE_FALSE || this.type === QuestionType.SHORT_ANSWER || this.type === QuestionType.ESSAY) {
          return !this.options || this.options.length === 0
        }
        return true
      },
      message: 'Multiple choice questions must have at least 2 options'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(this: IQuestion & Document) {
        // For multiple choice, correct answer must be one of the options
        if (this.type === QuestionType.MULTIPLE_CHOICE && this.options) {
          return this.options.includes(this.correctAnswer)
        }
        // For true/false, answer must be 'true' or 'false'
        if (this.type === QuestionType.TRUE_FALSE) {
          return ['true', 'false'].includes(this.correctAnswer.toLowerCase())
        }
        return true
      },
      message: 'Invalid correct answer for question type'
    }
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
})

// Quiz Submission Schema
const quizSubmissionSchema = new Schema<IQuizSubmission & Document>({
  quizId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  answers: [quizAnswerSchema],
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0,
  },
  isPassed: {
    type: Boolean,
    required: true,
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Quiz Schema
const quizSchema = new Schema<IQuiz & Document>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  courseId: {
    type: String,
    required: true,
  },
  timeLimit: {
    type: Number,
    min: 1,
    validate: {
      validator: function(v: number) {
        return v === undefined || v >= 1
      },
      message: 'Time limit must be at least 1 minute'
    }
  },
  maxAttempts: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

// Virtual relationships
quizSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
})

quizSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quizId',
})

quizSchema.virtual('submissions', {
  ref: 'QuizSubmission',
  localField: '_id',
  foreignField: 'quizId',
})

quizSubmissionSchema.virtual('quiz', {
  ref: 'Quiz',
  localField: 'quizId',
  foreignField: '_id',
  justOne: true,
})

quizSubmissionSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
})

// Ensure virtual fields are serialized
quizSchema.set('toJSON', { virtuals: true })
quizSchema.set('toObject', { virtuals: true })
questionSchema.set('toJSON', { virtuals: true })
questionSchema.set('toObject', { virtuals: true })
quizSubmissionSchema.set('toJSON', { virtuals: true })
quizSubmissionSchema.set('toObject', { virtuals: true })

// Indexes for performance
quizSchema.index({ courseId: 1 })
quizSchema.index({ isPublished: 1 })
quizSchema.index({ createdAt: -1 })

questionSchema.index({ quizId: 1, order: 1 })

quizSubmissionSchema.index({ quizId: 1, studentId: 1 })
quizSubmissionSchema.index({ studentId: 1, submittedAt: -1 })
quizSubmissionSchema.index({ quizId: 1, submittedAt: -1 })

// Compound indexes for common queries
quizSchema.index({ courseId: 1, isPublished: 1 })
quizSubmissionSchema.index({ studentId: 1, isPassed: 1 })

// Validation middleware for questions
questionSchema.pre('save', function(next) {
  // Clean up options field based on question type
  if (this.type === QuestionType.TRUE_FALSE || this.type === QuestionType.SHORT_ANSWER || this.type === QuestionType.ESSAY) {
    this.options = undefined
  }
  next()
})

// Validation middleware
quizSubmissionSchema.pre('save', function(next) {
  // Calculate if passed based on score and total points
  const percentage = (this.score / this.totalPoints) * 100
  // We'll need to get the quiz's passing score, but for now we'll use a default
  // This should be handled in the application logic when creating submissions
  next()
})

export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz & Document>('Quiz', quizSchema)
export const Question = mongoose.models.Question || mongoose.model<IQuestion & Document>('Question', questionSchema)
export const QuizSubmission = mongoose.models.QuizSubmission || mongoose.model<IQuizSubmission & Document>('QuizSubmission', quizSubmissionSchema)