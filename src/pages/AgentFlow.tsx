import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Brain, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agent {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
}

const AgentFlow = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentType, setNewAgentType] = useState("welcome");

  const handleAddAgent = () => {
    if (!newAgentName) return;

    const newAgent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAgentName,
      type: newAgentType,
      x: agents.length * 200 + 100,
      y: 200,
    };

    setAgents([...agents, newAgent]);
    setNewAgentName("");
    setNewAgentType("welcome");
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case "welcome":
        return "bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800";
      case "sales":
        return "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800";
      case "knowledge":
        return "bg-purple-100 border-purple-300 dark:bg-purple-950 dark:border-purple-800";
      case "support":
        return "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800";
      default:
        return "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Flow</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Design and manage your agent workflows
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter agent name"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type</Label>
                  <Select
                    value={newAgentType}
                    onValueChange={setNewAgentType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome Sen</SelectItem>
                      <SelectItem value="sales">Sales Sen</SelectItem>
                      <SelectItem value="knowledge">Knowledge Sen</SelectItem>
                      <SelectItem value="support">Personalized Support Sen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddAgent} className="w-full">
                  Create Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative w-full h-[600px] border rounded-lg bg-white dark:bg-slate-900 overflow-auto">
          <div className="absolute inset-0">
            {agents.map((agent, index) => (
              <div
                key={agent.id}
                className={`absolute p-4 rounded-lg border-2 cursor-move ${getAgentColor(
                  agent.type
                )}`}
                style={{
                  left: agent.x,
                  top: agent.y,
                  width: "180px",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5" />
                  <h3 className="font-semibold">{agent.name}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent
                </p>
                {index < agents.length - 1 && (
                  <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentFlow;