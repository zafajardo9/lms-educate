import { describe, it, expect, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { Quiz, Question, QuizSubmission } from '@/lib/models/Quiz'
import { Course } from '@/lib/models/Course'
import { User } from '@/lib/models/User'
import { QuestionType, UserRole, CourseLevel } from '@/types'

describe('Quiz Models', () => {
  let testUser: any
  let testStudent: any
  let testCourse: any

  beforeEach(async () => {
    // Create test users with unique emails
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    testUser = await User.create({
      email: `lecturer-${uniqueId}@test.com`,
      password: 'password123',
      name: 'Test Lecturer',
      role: UserRole.LECTURER,
    })

    testStudent = await User.create({
      email: `student-${uniqueId}@test.com`,
      password: 'password123',
      name: 'Test Student',
      role: UserRole.STUDENT,
    })

    // Create test course
    testCourse = await Course.create({
      title: 'Test Course',
      description: 'A test course description',
      lecturerId: testUser._id,
      level: CourseLevel.BEGINNER,
    })
  })

  describe('Quiz Model', () => {
    it('should create a valid quiz', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'A test quiz description',
        courseId: testCourse._id,
        timeLimit: 60,
        maxAttempts: 3,
        passingScore: 70,
      }

      const quiz = await Quiz.create(quizData)

      expect(quiz.title).toBe(quizData.title)
      expect(quiz.description).toBe(quizData.description)
      expect(quiz.courseId.toString()).toBe(testCourse._id.toString())
      expect(quiz.timeLimit).toBe(quizData.timeLimit)
      expect(quiz.maxAttempts).toBe(quizData.maxAttempts)
      expect(quiz.passingScore).toBe(quizData.passingScore)
      expect(quiz.isPublished).toBe(false) // default value
      expect(quiz.createdAt).toBeDefined()
      expect(quiz.updatedAt).toBeDefined()
    })

    it('should require title, description, courseId, maxAttempts, and passingScore', async () => {
      const invalidQuiz = new Quiz({})
      
      await expect(invalidQuiz.save()).rejects.toThrow()
    })

    it('should validate maxAttempts range', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'A test quiz description',
        courseId: testCourse._id,
        maxAttempts: 0, // Invalid: less than 1
        passingScore: 70,
      }

      await expect(Quiz.create(quizData)).rejects.toThrow()

      // Test upper bound
      quizData.maxAttempts = 11 // Invalid: greater than 10
      await expect(Quiz.create(quizData)).rejects.toThrow()
    })

    it('should validate passingScore range', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'A test quiz description',
        courseId: testCourse._id,
        maxAttempts: 3,
        passingScore: -1, // Invalid: less than 0
      }

      await expect(Quiz.create(quizData)).rejects.toThrow()

      // Test upper bound
      quizData.passingScore = 101 // Invalid: greater than 100
      await expect(Quiz.create(quizData)).rejects.toThrow()
    })

    it('should validate timeLimit minimum', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'A test quiz description',
        courseId: testCourse._id,
        timeLimit: 0, // Invalid: less than 1
        maxAttempts: 3,
        passingScore: 70,
      }

      await expect(Quiz.create(quizData)).rejects.toThrow()
    })

    it('should validate title and description length', async () => {
      const longTitle = 'a'.repeat(201)
      const longDescription = 'a'.repeat(1001)

      const quizWithLongTitle = {
        title: longTitle,
        description: 'Valid description',
        courseId: testCourse._id,
        maxAttempts: 3,
        passingScore: 70,
      }

      await expect(Quiz.create(quizWithLongTitle)).rejects.toThrow()

      const quizWithLongDescription = {
        title: 'Valid Title',
        description: longDescription,
        courseId: testCourse._id,
        maxAttempts: 3,
        passingScore: 70,
      }

      await expect(Quiz.create(quizWithLongDescription)).rejects.toThrow()
    })
  })

  describe('Question Model', () => {
    let testQuiz: any

    beforeEach(async () => {
      testQuiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'A test quiz description',
        courseId: testCourse._id,
        maxAttempts: 3,
        passingScore: 70,
      })
    })

    it('should create a valid multiple choice question', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.MULTIPLE_CHOICE,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic arithmetic',
        points: 10,
        order: 1,
      }

      const question = await Question.create(questionData)

      expect(question.quizId.toString()).toBe(testQuiz._id.toString())
      expect(question.type).toBe(QuestionType.MULTIPLE_CHOICE)
      expect(question.question).toBe(questionData.question)
      expect(question.options).toEqual(questionData.options)
      expect(question.correctAnswer).toBe(questionData.correctAnswer)
      expect(question.explanation).toBe(questionData.explanation)
      expect(question.points).toBe(questionData.points)
      expect(question.order).toBe(questionData.order)
    })

    it('should create a valid true/false question', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.TRUE_FALSE,
        question: 'The sky is blue.',
        correctAnswer: 'true',
        points: 5,
        order: 1,
      }

      const question = await Question.create(questionData)

      expect(question.type).toBe(QuestionType.TRUE_FALSE)
      expect(question.question).toBe(questionData.question)
      expect(question.correctAnswer).toBe(questionData.correctAnswer)
      expect(question.options).toBeUndefined()
    })

    it('should create a valid short answer question', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.SHORT_ANSWER,
        question: 'What is the capital of France?',
        correctAnswer: 'Paris',
        points: 15,
        order: 1,
      }

      const question = await Question.create(questionData)

      expect(question.type).toBe(QuestionType.SHORT_ANSWER)
      expect(question.question).toBe(questionData.question)
      expect(question.correctAnswer).toBe(questionData.correctAnswer)
    })

    it('should require quizId, type, question, correctAnswer, points, and order', async () => {
      const invalidQuestion = new Question({})
      
      await expect(invalidQuestion.save()).rejects.toThrow()
    })

    it('should validate multiple choice questions have at least 2 options', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.MULTIPLE_CHOICE,
        question: 'What is 2 + 2?',
        options: ['4'], // Invalid: only 1 option
        correctAnswer: '4',
        points: 10,
        order: 1,
      }

      await expect(Question.create(questionData)).rejects.toThrow()
    })

    it('should validate correct answer is in options for multiple choice', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.MULTIPLE_CHOICE,
        question: 'What is 2 + 2?',
        options: ['3', '5', '6'],
        correctAnswer: '4', // Invalid: not in options
        points: 10,
        order: 1,
      }

      await expect(Question.create(questionData)).rejects.toThrow()
    })

    it('should validate true/false correct answer format', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.TRUE_FALSE,
        question: 'The sky is blue.',
        correctAnswer: 'maybe', // Invalid: not 'true' or 'false'
        points: 5,
        order: 1,
      }

      await expect(Question.create(questionData)).rejects.toThrow()
    })

    it('should validate points range', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.SHORT_ANSWER,
        question: 'Test question',
        correctAnswer: 'Test answer',
        points: 0, // Invalid: less than 1
        order: 1,
      }

      await expect(Question.create(questionData)).rejects.toThrow()

      // Test upper bound
      questionData.points = 101 // Invalid: greater than 100
      await expect(Question.create(questionData)).rejects.toThrow()
    })

    it('should validate order is non-negative', async () => {
      const questionData = {
        quizId: testQuiz._id,
        type: QuestionType.SHORT_ANSWER,
        question: 'Test question',
        correctAnswer: 'Test answer',
        points: 10,
        order: -1, // Invalid: negative
      }

      await expect(Question.create(questionData)).rejects.toThrow()
    })

    it('should validate question and explanation length', async () => {
      const longQuestion = 'a'.repeat(1001)
      const longExplanation = 'a'.repeat(1001)

      const questionWithLongQuestion = {
        quizId: testQuiz._id,
        type: QuestionType.SHORT_ANSWER,
        question: longQuestion,
        correctAnswer: 'Test answer',
        points: 10,
        order: 1,
      }

      await expect(Question.create(questionWithLongQuestion)).rejects.toThrow()

      const questionWithLongExplanation = {
        quizId: testQuiz._id,
        type: QuestionType.SHORT_ANSWER,
        question: 'Valid question',
        correctAnswer: 'Test answer',
        explanation: longExplanation,
        points: 10,
        order: 1,
      }

      await expect(Question.create(questionWithLongExplanation)).rejects.toThrow()
    })
  })

  describe('QuizSubmission Model', () => {
    let testQuiz: any
    let testQuestion: any

    beforeEach(async () => {
      testQuiz = await Quiz.create({
        title: 'Test Quiz',
        description: 'A test quiz description',
        courseId: testCourse._id,
        maxAttempts: 3,
        passingScore: 70,
      })

      testQuestion = await Question.create({
        quizId: testQuiz._id,
        type: QuestionType.MULTIPLE_CHOICE,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        points: 10,
        order: 1,
      })
    })

    it('should create a valid quiz submission', async () => {
      const submissionData = {
        quizId: testQuiz._id,
        studentId: testStudent._id,
        answers: [{
          questionId: testQuestion._id,
          answer: '4',
          isCorrect: true,
          pointsEarned: 10,
        }],
        score: 10,
        totalPoints: 10,
        isPassed: true,
        timeSpent: 15,
      }

      const submission = await QuizSubmission.create(submissionData)

      expect(submission.quizId.toString()).toBe(testQuiz._id.toString())
      expect(submission.studentId.toString()).toBe(testStudent._id.toString())
      expect(submission.answers).toHaveLength(1)
      expect(submission.answers[0].questionId.toString()).toBe(testQuestion._id.toString())
      expect(submission.answers[0].answer).toBe('4')
      expect(submission.answers[0].isCorrect).toBe(true)
      expect(submission.answers[0].pointsEarned).toBe(10)
      expect(submission.score).toBe(10)
      expect(submission.totalPoints).toBe(10)
      expect(submission.isPassed).toBe(true)
      expect(submission.timeSpent).toBe(15)
      expect(submission.submittedAt).toBeDefined()
    })

    it('should require quizId, studentId, answers, score, totalPoints, isPassed, and timeSpent', async () => {
      const invalidSubmission = new QuizSubmission({})
      
      await expect(invalidSubmission.save()).rejects.toThrow()
    })

    it('should validate score is non-negative', async () => {
      const submissionData = {
        quizId: testQuiz._id,
        studentId: testStudent._id,
        answers: [],
        score: -1, // Invalid: negative
        totalPoints: 10,
        isPassed: false,
        timeSpent: 15,
      }

      await expect(QuizSubmission.create(submissionData)).rejects.toThrow()
    })

    it('should validate totalPoints is non-negative', async () => {
      const submissionData = {
        quizId: testQuiz._id,
        studentId: testStudent._id,
        answers: [],
        score: 0,
        totalPoints: -1, // Invalid: negative
        isPassed: false,
        timeSpent: 15,
      }

      await expect(QuizSubmission.create(submissionData)).rejects.toThrow()
    })

    it('should validate timeSpent is non-negative', async () => {
      const submissionData = {
        quizId: testQuiz._id,
        studentId: testStudent._id,
        answers: [],
        score: 0,
        totalPoints: 10,
        isPassed: false,
        timeSpent: -1, // Invalid: negative
      }

      await expect(QuizSubmission.create(submissionData)).rejects.toThrow()
    })

    it('should validate quiz answer structure', async () => {
      const submissionData = {
        quizId: testQuiz._id,
        studentId: testStudent._id,
        answers: [{
          questionId: testQuestion._id,
          answer: '4',
          isCorrect: true,
          pointsEarned: -1, // Invalid: negative points
        }],
        score: 10,
        totalPoints: 10,
        isPassed: true,
        timeSpent: 15,
      }

      await expect(QuizSubmission.create(submissionData)).rejects.toThrow()
    })
  })
})