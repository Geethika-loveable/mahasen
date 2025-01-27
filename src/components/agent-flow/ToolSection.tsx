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

interface Tool {
  id: string;
  name: string;
  description: string;
}

export const ToolSection = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const handleAddTool = () => {
    const newTool = {
      id: `tool-${Date.now()}`,
      name: `Sample Tool ${tools.length + 1}`,
      description: "This is a sample tool description. Click to edit.",
    };
    setTools([...tools, newTool]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-all flex items-center justify-center h-48"
          onClick={handleAddTool}
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8" />
            <span>Add Tool</span>
          </div>
        </Card>
        {tools.map((tool) => (
          <Card 
            key={tool.id} 
            className="p-4 cursor-pointer hover:shadow-lg transition-all h-48"
            onClick={() => setSelectedTool(tool)}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{tool.name}</h3>
                <ChevronDown className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {tool.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTool?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{selectedTool?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};