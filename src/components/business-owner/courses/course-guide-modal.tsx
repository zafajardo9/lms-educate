"use client";

import { useState } from "react";
import {
  BookOpen,
  UserPlus,
  UsersRound,
  GraduationCap,
  Users,
  Layers,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCourseGuide } from "@/lib/guide-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  UserPlus,
  UsersRound,
  GraduationCap,
  Users,
  Layers,
};

interface CourseGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseGuideModal({
  open,
  onOpenChange,
}: CourseGuideModalProps) {
  const guide = getCourseGuide();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const renderIcon = (iconName: string, className?: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className={className} /> : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {guide.title}
          </DialogTitle>
          <DialogDescription>{guide.description}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          {/* Sections */}
          <div className="space-y-3">
            {guide.sections.map((section) => (
              <div key={section.id} className="rounded-lg border bg-card">
                <button
                  onClick={() =>
                    setActiveSection(
                      activeSection === section.id ? null : section.id
                    )
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {renderIcon(section.icon, "h-5 w-5 text-primary")}
                    <span className="font-medium">{section.title}</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      activeSection === section.id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {activeSection === section.id && (
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t">
                    <p className="text-sm text-muted-foreground pt-3">
                      {section.content}
                    </p>

                    {/* Tips */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                        Tips
                      </p>
                      <ul className="space-y-1">
                        {section.tips.map((tip, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Roles (for instructors section) */}
                    {section.roles && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Instructor Roles</p>
                        <div className="grid grid-cols-2 gap-2">
                          {section.roles.map((role) => (
                            <div
                              key={role.name}
                              className="p-2 rounded border bg-muted/30"
                            >
                              <p className="text-sm font-medium">{role.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {role.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group Types (for groups section) */}
                    {section.groupTypes && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Group Types</p>
                        <div className="grid grid-cols-2 gap-2">
                          {section.groupTypes.map((type) => (
                            <div
                              key={type.name}
                              className="p-2 rounded border bg-muted/30"
                            >
                              <p className="text-sm font-medium">{type.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {type.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-6 pb-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {guide.faq.map((item, idx) => (
                <div key={idx} className="rounded-lg border">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
                  >
                    <span className="text-sm font-medium">{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        activeFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-3 pb-3 pt-0 border-t">
                      <p className="text-sm text-muted-foreground pt-2">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hint button component for easy reuse
interface HintButtonProps {
  onClick: () => void;
  className?: string;
}

export function HintButton({ onClick, className }: HintButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className={className}>
      <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
      Hint
    </Button>
  );
}
