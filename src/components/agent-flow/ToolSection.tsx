import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus, ChevronDown, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Tool {
  id: string;
  name: string;
  description: string;
}

export const ToolSection = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddTool = () => {
    const newTool = {
      id: `tool-${Date.now()}`,
      name: `Sample Tool ${tools.length + 1}`,
      description: "This is a sample tool description. Click to edit.",
    };
    setTools([...tools, newTool]);
  };

  const handleSave = (updatedTool: Tool) => {
    setTools(tools.map(tool => 
      tool.id === updatedTool.id ? updatedTool : tool
    ));
    setSelectedTool(null);
    setIsEditing(false);
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
            onClick={() => {
              setSelectedTool(tool);
              setIsEditing(true);
            }}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{tool.name}</h3>
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {tool.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog 
        open={isEditing && !!selectedTool} 
        onOpenChange={() => {
          setIsEditing(false);
          setSelectedTool(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Textarea
                id="name"
                defaultValue={selectedTool?.name}
                rows={1}
                className="resize-none"
                onChange={(e) => {
                  if (selectedTool) {
                    setSelectedTool({
                      ...selectedTool,
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
                defaultValue={selectedTool?.description}
                rows={4}
                onChange={(e) => {
                  if (selectedTool) {
                    setSelectedTool({
                      ...selectedTool,
                      description: e.target.value
                    });
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => selectedTool && handleSave(selectedTool)}
              className="w-full bg-[#ea384c] hover:bg-[#ea384c]/90"
            >
              Update Tool
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};