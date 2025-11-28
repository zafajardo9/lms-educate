"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  GripVertical,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { Question, QuestionType, Option } from "./quiz-builder";

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  canDelete: boolean;
}

export function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  canDelete,
}: QuestionCardProps) {
  const handleTypeChange = (type: QuestionType) => {
    let newOptions: Option[] = [];

    if (type === "multiple-choice") {
      newOptions = [
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ];
    } else if (type === "true-false") {
      newOptions = [
        { id: crypto.randomUUID(), text: "True", isCorrect: false },
        { id: crypto.randomUUID(), text: "False", isCorrect: false },
      ];
    }

    onUpdate({ type, options: newOptions, correctAnswer: undefined });
  };

  const handleOptionChange = (optionId: string, text: string) => {
    onUpdate({
      options: question.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const handleCorrectAnswerChange = (optionId: string) => {
    onUpdate({
      options: question.options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optionId,
      })),
    });
  };

  const addOption = () => {
    if (question.options.length < 6) {
      onUpdate({
        options: [
          ...question.options,
          { id: crypto.randomUUID(), text: "", isCorrect: false },
        ],
      });
    }
  };

  const removeOption = (optionId: string) => {
    if (question.options.length > 2) {
      onUpdate({
        options: question.options.filter((opt) => opt.id !== optionId),
      });
    }
  };

  return (
    <Card className="group relative transition-shadow hover:shadow-md !rounded-lg corner-shape-normal">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {index + 1}
            </span>
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True / False</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 mr-3">
              <Label
                htmlFor={`points-${question.id}`}
                className="text-sm text-muted-foreground"
              >
                Points:
              </Label>
              <Input
                id={`points-${question.id}`}
                type="number"
                value={question.points}
                onChange={(e) =>
                  onUpdate({ points: Number.parseInt(e.target.value) || 0 })
                }
                className="w-16 h-8 text-center"
                min={0}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Duplicate question</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={!canDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete question</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="Enter your question here..."
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="text-base"
        />

        {question.type === "short-answer" ? (
          <div className="p-4 border border-dashed rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Respondents will type their answer in a text field
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Options (click to mark correct answer)
            </Label>
            <RadioGroup
              value={question.options.find((opt) => opt.isCorrect)?.id}
              onValueChange={handleCorrectAnswerChange}
            >
              {question.options.map((option, optIndex) => (
                <div
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    option.isCorrect
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="sr-only"
                  />
                  <label
                    htmlFor={option.id}
                    className="cursor-pointer flex-shrink-0"
                  >
                    {option.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </label>
                  <Input
                    placeholder={`Option ${optIndex + 1}`}
                    value={option.text}
                    onChange={(e) =>
                      handleOptionChange(option.id, e.target.value)
                    }
                    className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                    disabled={question.type === "true-false"}
                  />
                  {question.type === "multiple-choice" &&
                    question.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(option.id)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove option</span>
                      </Button>
                    )}
                </div>
              ))}
            </RadioGroup>

            {question.type === "multiple-choice" &&
              question.options.length < 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </Button>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
