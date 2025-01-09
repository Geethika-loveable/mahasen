import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/types/agent";

interface AgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  isActive: boolean;
  onSave: (agent: Agent) => void;
}

export const AgentDialog = ({ isOpen, onClose, agent, isActive, onSave }: AgentDialogProps) => {
  const handleSave = () => {
    onSave(agent);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isActive ? "Edit Agent" : "Add Agent"}: {agent.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="systemRole">System Role</Label>
            <Textarea
              id="systemRole"
              defaultValue={agent.systemRole}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Default Prompt</Label>
            <Textarea
              id="prompt"
              defaultValue={agent.prompt}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            <ul className="list-disc pl-4 space-y-1">
              {agent.features.map((feature, index) => (
                <li key={index} className="text-sm text-slate-600 dark:text-slate-400">
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <Button 
            onClick={handleSave}
            className="w-full"
          >
            {isActive ? "Update Agent" : "Add Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};