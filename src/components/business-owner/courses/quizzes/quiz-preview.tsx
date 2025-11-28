"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Trophy } from "lucide-react"
import type { Quiz, Question } from "./quiz-builder"

interface QuizPreviewProps {
  quiz: Quiz
  onBack: () => void
}

export function QuizPreview({ quiz, onBack }: QuizPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const calculateScore = () => {
    let score = 0
    let total = 0

    quiz.questions.forEach((question) => {
      total += question.points
      const userAnswer = answers[question.id]

      if (question.type === "short-answer") {
        // For short answer, we can't auto-grade
        return
      }

      const correctOption = question.options.find((opt) => opt.isCorrect)
      if (correctOption && userAnswer === correctOption.id) {
        score += question.points
      }
    })

    return { score, total }
  }

  const { score, total } = calculateScore()
  const hasShortAnswer = quiz.questions.some((q) => q.type === "short-answer")

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Editor
      </Button>

      <Card className="border-t-4 border-t-primary mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title || "Untitled Quiz"}</CardTitle>
          {quiz.description && <p className="text-muted-foreground mt-2">{quiz.description}</p>}
        </CardHeader>
      </Card>

      {submitted && (
        <Card className="mb-6 bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Quiz Submitted!</h3>
                <p className="text-muted-foreground">
                  Your score: {score} / {total} points
                  {hasShortAnswer && " (Short answers require manual grading)"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {quiz.questions.map((question, index) => (
          <QuestionPreview
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id]}
            onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
            submitted={submitted}
          />
        ))}
      </div>

      {!submitted && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} size="lg" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  )
}

interface QuestionPreviewProps {
  question: Question
  index: number
  answer?: string
  onAnswerChange: (answer: string) => void
  submitted: boolean
}

function QuestionPreview({ question, index, answer, onAnswerChange, submitted }: QuestionPreviewProps) {
  const correctOption = question.options.find((opt) => opt.isCorrect)
  const isCorrect = correctOption && answer === correctOption.id
  const showResult = submitted && question.type !== "short-answer"

  return (
    <Card
      className={`transition-colors ${
        showResult ? (isCorrect ? "border-green-500 bg-green-50/50" : "border-destructive bg-destructive/5") : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {index + 1}
            </span>
            <span className="font-medium">{question.text || "No question text"}</span>
          </div>
          <span className="text-sm text-muted-foreground">{question.points} pts</span>
        </div>
      </CardHeader>

      <CardContent>
        {question.type === "short-answer" ? (
          <Input
            placeholder="Type your answer..."
            value={answer || ""}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={submitted}
          />
        ) : (
          <RadioGroup value={answer} onValueChange={onAnswerChange} disabled={submitted}>
            {question.options.map((option) => {
              const isThisCorrect = option.isCorrect
              const isSelected = answer === option.id
              const showCorrect = submitted && isThisCorrect
              const showWrong = submitted && isSelected && !isThisCorrect

              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    showCorrect
                      ? "border-green-500 bg-green-50"
                      : showWrong
                        ? "border-destructive bg-destructive/10"
                        : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={option.id} id={`preview-${option.id}`} />
                  <Label htmlFor={`preview-${option.id}`} className="flex-1 cursor-pointer">
                    {option.text || "Empty option"}
                  </Label>
                  {showCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
              )
            })}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  )
}
