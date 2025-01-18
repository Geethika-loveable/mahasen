import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { AgentCard } from "@/components/agent-flow/AgentCard";
import { AgentDialog } from "@/components/agent-flow/AgentDialog";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { defaultAgents } from "@/components/agent-flow/defaultAgents";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AgentFlow = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*');
    
    if (error) {
      toast({
        title: "Error loading agents",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const formattedAgents: Agent[] = data.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        systemRole: agent.system_role,
        prompt: agent.prompt,
        features: agent.features
      }));
      setAgents(formattedAgents);
    }
  };

  const handleAddAgent = async (defaultAgent: Agent) => {
    const { data, error } = await supabase
      .from('agents')
      .insert([{
        name: defaultAgent.name,
        type: defaultAgent.type,
        system_role: defaultAgent.systemRole,
        prompt: defaultAgent.prompt,
        features: defaultAgent.features,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding agent",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const newAgent: Agent = {
        id: data.id,
        name: data.name,
        type: data.type,
        systemRole: data.system_role,
        prompt: data.prompt,
        features: data.features,
      };
      setAgents([...agents, newAgent]);
      toast({
        title: "Agent added",
        description: `${defaultAgent.name} has been added successfully.`,
      });
    }
  };

  const handleUpdateAgent = async (updatedAgent: Agent) => {
    const { error } = await supabase
      .from('agents')
      .update({
        name: updatedAgent.name,
        type: updatedAgent.type,
        system_role: updatedAgent.systemRole,
        prompt: updatedAgent.prompt,
        features: updatedAgent.features,
      })
      .eq('id', updatedAgent.id);

    if (error) {
      toast({
        title: "Error updating agent",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAgents(agents.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    setSelectedAgent(null);
    toast({
      title: "Agent updated",
      description: `${updatedAgent.name} has been updated successfully.`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Button 
              variant="ghost" 
              className="mb-4 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Agent Flow</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Design and manage your agent workflows
            </p>
          </div>
        </div>

        {/* Main Agent Box with Arrow */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 animate-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 group-hover:from-pink-500 group-hover:via-purple-500 group-hover:to-blue-500 blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
            <Card className="relative w-48 h-48 p-4 flex flex-col items-center justify-center text-center bg-background border-2 border-transparent hover:scale-105 transition-transform duration-300">
              <h3 className="font-semibold text-xl mb-2">Mahasen</h3>
              <p className="text-sm text-muted-foreground">Main Agent</p>
            </Card>
          </div>
          
          <ArrowDown className="h-8 w-8 text-primary/50" />
          
          {/* Agent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {defaultAgents.map((defaultAgent) => {
              const existingAgent = agents.find(a => a.type === defaultAgent.type);
              return (
                <AgentCard
                  key={defaultAgent.id}
                  agent={existingAgent || defaultAgent}
                  isActive={!!existingAgent}
                  onClick={() => {
                    setSelectedAgent(existingAgent || defaultAgent);
                    setIsDialogOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>

        {selectedAgent && (
          <AgentDialog
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedAgent(null);
            }}
            agent={selectedAgent}
            isActive={agents.some(a => a.type === selectedAgent.type)}
            onSave={(agent) => {
              const isActive = agents.some(a => a.type === agent.type);
              if (isActive) {
                handleUpdateAgent(agent);
              } else {
                handleAddAgent(agent);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AgentFlow;