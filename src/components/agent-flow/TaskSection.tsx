import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const TaskSection = () => {
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState("");

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tasks</h2>
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Enter task description"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="max-w-xs"
        />
        <Button
          onClick={handleAddTask}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tasks.map((task, index) => (
          <Card key={index} className="p-4">
            {task}
          </Card>
        ))}
      </div>
    </div>
  );
};