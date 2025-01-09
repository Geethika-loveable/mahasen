import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { Agent } from "@/types/agent";

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const AgentCard = ({ agent, isActive, onClick, className = "" }: AgentCardProps) => {
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
    <Card 
      className={`w-48 h-48 p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
        isActive ? getAgentColor(agent.type) : "bg-gray-100 dark:bg-gray-800"
      } ${className}`}
      onClick={onClick}
    >
      {isActive ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5" />
            <h3 className="font-semibold">{agent.name}</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click to edit configuration
          </p>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Add {agent.name}
          </div>
        </div>
      )}
    </Card>
  );
};