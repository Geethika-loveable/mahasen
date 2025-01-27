import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  name: string;
  description: string;
}

export const TaskSection = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleAddTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      name: `Sample Task ${tasks.length + 1}`,
      description: "This is a sample task description. Click to edit.",
    };
    setTasks([...tasks, newTask]);
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
            className="p-4 cursor-pointer hover:shadow-lg transition-all h-48"
            onClick={() => setSelectedTask(task)}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{task.name}</h3>
                <ChevronDown className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {task.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{selectedTask?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};