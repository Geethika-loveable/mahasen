import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus, ChevronDown, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  name: string;
  description: string;
}

export const TaskSection = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      name: `Sample Task ${tasks.length + 1}`,
      description: "This is a sample task description. Click to edit.",
    };
    setTasks([...tasks, newTask]);
  };

  const handleSave = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setSelectedTask(null);
    setIsEditing(false);
  };

  const handleRemove = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-all flex items-center justify-center h-48"
          onClick={handleAddTask}
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8" />
            <span>Add Task</span>
          </div>
        </Card>
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            className="p-4 cursor-pointer hover:shadow-lg transition-all h-48 relative"
          >
            <div 
              className="h-full flex flex-col"
              onClick={() => {
                setSelectedTask(task);
                setIsEditing(true);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{task.name}</h3>
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {task.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 text-destructive hover:text-destructive/90"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(task.id);
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      <Dialog 
        open={isEditing && !!selectedTask} 
        onOpenChange={() => {
          setIsEditing(false);
          setSelectedTask(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Textarea
                id="name"
                defaultValue={selectedTask?.name}
                rows={1}
                className="resize-none"
                onChange={(e) => {
                  if (selectedTask) {
                    setSelectedTask({
                      ...selectedTask,
                      name: e.target.value
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue={selectedTask?.description}
                rows={4}
                onChange={(e) => {
                  if (selectedTask) {
                    setSelectedTask({
                      ...selectedTask,
                      description: e.target.value
                    });
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => selectedTask && handleSave(selectedTask)}
              className="w-full bg-[#ea384c] hover:bg-[#ea384c]/90"
            >
              Update Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};