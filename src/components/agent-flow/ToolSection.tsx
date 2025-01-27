import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ToolSection = () => {
  const [tools, setTools] = useState<string[]>([]);
  const [newTool, setNewTool] = useState("");

  const handleAddTool = () => {
    if (newTool.trim()) {
      setTools([...tools, newTool.trim()]);
      setNewTool("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Tools</h2>
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Enter tool name"
          value={newTool}
          onChange={(e) => setNewTool(e.target.value)}
          className="max-w-xs"
        />
        <Button
          onClick={handleAddTool}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <Card key={index} className="p-4">
            {tool}
          </Card>
        ))}
      </div>
    </div>
  );
};