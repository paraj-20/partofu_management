"use client"

import React, { useState } from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    useDroppable,
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    MessageSquare,
    Trash2,
    Edit3,
    ArrowUpCircle,
    ArrowRightCircle,
    ArrowDownCircle,
    GripVertical
} from "lucide-react"

type TaskItem = {
    id: number
    title: string
    description: string
    priority: string
    status: string
    due_date: string | null
    created_by: number
    creator_name: string
    assignees: { id: number; name: string }[]
    comments: { id: number; content: string; user_name: string; created_at: string }[]
    created_at: string
}

interface TaskBoardProps {
    tasks: TaskItem[]
    onStatusChange: (taskId: number, newStatus: string) => Promise<void>
    onEdit: (task: TaskItem) => void
    onDelete: (taskId: number) => void
    currentUser: any
}

function priorityIcon(priority: string) {
    switch (priority) {
        case "high": return <ArrowUpCircle className="h-4 w-4 text-destructive" />
        case "medium": return <ArrowRightCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
        case "low": return <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" />
        default: return null
    }
}

function statusLabel(status: string) {
    switch (status) {
        case "todo": return <Badge variant="secondary">To Do</Badge>
        case "in_progress": return <Badge className="bg-primary/20 text-primary border-0">In Progress</Badge>
        case "completed": return <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">Done</Badge>
        default: return <Badge variant="secondary">{status}</Badge>
    }
}

function SortableTaskCard({ task, onEdit, onDelete, currentUser }: {
    task: TaskItem,
    onEdit: (t: TaskItem) => void,
    onDelete: (id: number) => void,
    currentUser: any
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        scale: isDragging ? 0.95 : 1,
        zIndex: isDragging ? 50 : 0
    }

    const canDelete = currentUser?.role === "admin" || task.created_by === currentUser?.userId

    return (
        <div ref={setNodeRef} style={style} className="group relative">
            <Card className="bg-card border-border hover:border-primary/50 transition-colors shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary">
                            <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {priorityIcon(task.priority)}
                                <h3 className="text-sm font-medium text-foreground truncate">{task.title}</h3>
                            </div>
                            {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {task.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {task.due_date && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                )}
                                {task.comments.length > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <MessageSquare className="h-3 w-3" />
                                        {task.comments.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
                                <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            {canDelete && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onDelete(task.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function Column({ id, title, tasks, onEdit, onDelete, currentUser, color }: {
    id: string,
    title: string,
    tasks: TaskItem[],
    onEdit: (t: TaskItem) => void,
    onDelete: (id: number) => void,
    currentUser: any,
    color: string
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    })

    return (
        <div className="flex flex-col gap-4 min-w-[300px] flex-1">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color} shadow-sm`} />
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">{title}</h2>
                    <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground font-normal rounded-full px-2 h-5">
                        {tasks.length}
                    </Badge>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`bg-secondary/20 rounded-xl p-3 flex flex-col gap-3 min-h-[500px] border-2 transition-colors ${isOver ? 'border-primary/40 bg-secondary/40' : 'border-dashed border-border/50'
                    }`}
            >
                <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            currentUser={currentUser}
                        />
                    ))}
                    {tasks.length === 0 && !isOver && (
                        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground text-[10px] uppercase tracking-tighter opacity-50 select-none">
                            Drop tasks here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    )
}

export function TaskBoard({ tasks, onStatusChange, onEdit, onDelete, currentUser }: TaskBoardProps) {
    const [activeTask, setActiveTask] = useState<TaskItem | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const columns = [
        { id: "todo", title: "To Do", color: "bg-muted-foreground" },
        { id: "in_progress", title: "In Progress", color: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" },
        { id: "completed", title: "Completed", color: "bg-[hsl(var(--success))] shadow-[0_0_8px_rgba(var(--success),0.4)]" },
    ]

    const tasksByColumn = {
        todo: tasks.filter(t => t.status === "todo"),
        in_progress: tasks.filter(t => t.status === "in_progress"),
        completed: tasks.filter(t => t.status === "completed"),
    }

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        const task = tasks.find(t => t.id === active.id)
        if (task) setActiveTask(task)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const activeId = active.id as number
        const overId = over.id as string

        // 1. Dropped directly onto a column
        let newStatus = overId;

        // 2. Dropped onto another task card
        if (columns.every(c => c.id !== overId)) {
            const overTask = tasks.find(t => t.id === Number(overId))
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        const task = tasks.find(t => t.id === activeId)
        const validStatuses = columns.map(c => c.id);

        if (task && task.status !== newStatus && validStatuses.includes(newStatus)) {
            onStatusChange(activeId, newStatus)
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col md:flex-row gap-6 items-start overflow-x-auto pb-6">
                {columns.map(col => (
                    <Column
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        tasks={tasksByColumn[col.id as keyof typeof tasksByColumn]}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        currentUser={currentUser}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: "0.2",
                        },
                    },
                }),
            }}>
                {activeTask ? (
                    <Card className="bg-card border-primary shadow-2xl w-[300px] rotate-2 cursor-grabbing">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                {priorityIcon(activeTask.priority)}
                                <h3 className="text-sm font-medium text-foreground truncate">{activeTask.title}</h3>
                            </div>
                            <div className="flex justify-between items-center">
                                {statusLabel(activeTask.status)}
                                <Badge variant="outline" className="text-[10px] uppercase">{activeTask.priority}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
