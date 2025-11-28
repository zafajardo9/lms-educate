"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Trophy, RotateCcw } from "lucide-react";
import type { Quiz, Question } from "./quiz-builder";

interface QuizPreviewDialogProps {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizPreviewDialog({
  quiz,
  open,
  onOpenChange,
}: QuizPreviewDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const calculateScore = () => {
    let score = 0;
    let total = 0;

    quiz.questions.forEach((question) => {
      total += question.points;
      const userAnswer = answers[question.id];

      if (question.type === "short-answer") {
        // For short answer, we can't auto-grade
        return;
      }

      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && userAnswer === correctOption.id) {
        score += question.points;
      }
    });

    return { score, total };
  };

  const { score, total } = calculateScore();
  const hasShortAnswer = quiz.questions.some((q) => q.type === "short-answer");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {quiz.title || "Untitled Quiz"}
          </DialogTitle>
          {quiz.description && (
            <DialogDescription>{quiz.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {submitted && (
              <Card className="bg-primary/5 border-primary">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Quiz Submitted!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your score: {score} / {total} points
                        {hasShortAnswer &&
                          " (Short answers require manual grading)"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {quiz.questions.map((question, index) => (
              <QuestionPreviewCard
                key={question.id}
                question={question}
                index={index}
                answer={answers[question.id]}
                onAnswerChange={(answer) =>
                  handleAnswerChange(question.id, answer)
                }
                submitted={submitted}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          {!submitted && (
            <Button onClick={handleSubmit} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Submit Quiz
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuestionPreviewCardProps {
  question: Question;
  index: number;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  submitted: boolean;
}

function QuestionPreviewCard({
  question,
  index,
  answer,
  onAnswerChange,
  submitted,
}: QuestionPreviewCardProps) {
  const correctOption = question.options.find((opt) => opt.isCorrect);
  const isCorrect = correctOption && answer === correctOption.id;
  const showResult = submitted && question.type !== "short-answer";

  return (
    <Card
      className={`transition-colors ${
        showResult
          ? isCorrect
            ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
            : "border-destructive bg-destructive/5"
          : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {index + 1}
            </span>
            <span className="font-medium text-sm">
              {question.text || "No question text"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {question.points} pts
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {question.type === "short-answer" ? (
          <Input
            placeholder="Type your answer..."
            value={answer || ""}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={submitted}
            className="text-sm"
          />
        ) : (
          <RadioGroup
            value={answer}
            onValueChange={onAnswerChange}
            disabled={submitted}
            className="space-y-2"
          >
            {question.options.map((option) => {
              const isThisCorrect = option.isCorrect;
              const isSelected = answer === option.id;
              const showCorrect = submitted && isThisCorrect;
              const showWrong = submitted && isSelected && !isThisCorrect;

              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg border transition-colors ${
                    showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : showWrong
                      ? "border-destructive bg-destructive/10"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={`preview-${option.id}`}
                  />
                  <Label
                    htmlFor={`preview-${option.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {option.text || "Empty option"}
                  </Label>
                  {showCorrect && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              );
            })}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
