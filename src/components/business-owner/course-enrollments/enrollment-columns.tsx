"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Enrollment } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, CheckCircle, Users } from "lucide-react";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const getEnrollmentColumns = (
    onUnenroll: (enrollment: Enrollment) => void,
    onChangeCohort?: (enrollment: Enrollment) => void
): ColumnDef<Enrollment>[] => [
        {
            accessorKey: "student.name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Student" />
            ),
            cell: ({ row }) => {
                const student = row.original.student;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={student.profile?.avatar || undefined} alt={student.name} />
                            <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{student.name}</span>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "progress",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Progress" />
            ),
            cell: ({ row }) => {
                const progress = row.getValue("progress") as number;
                const isCompleted = !!row.original.completedAt;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] bg-secondary rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                        {isCompleted && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "cohort.name",
            header: "Cohort",
            cell: ({ row }) => {
                const cohort = row.original.cohort;
                return cohort ? (
                    <Badge variant="outline">{cohort.name}</Badge>
                ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                );
            },
        },
        {
            accessorKey: "groups",
            header: "Groups",
            cell: ({ row }) => {
                const groups = row.original.groups;
                return groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {groups.map((group) => (
                            <Badge key={group.id} variant="secondary" className="text-[10px]">
                                {group.name}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                );
            },
        },
        {
            accessorKey: "enrolledAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Enrolled" />
            ),
            cell: ({ row }) => {
                return (
                    <span className="text-xs text-muted-foreground">
                        {new Date(row.getValue("enrolledAt")).toLocaleDateString()}
                    </span>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const enrollment = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(enrollment.student.email)}
                            >
                                Copy Email
                            </DropdownMenuItem>
                            {onChangeCohort && (
                                <DropdownMenuItem onClick={() => onChangeCohort(enrollment)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Change Cohort
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onUnenroll(enrollment)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Unenroll Student
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
