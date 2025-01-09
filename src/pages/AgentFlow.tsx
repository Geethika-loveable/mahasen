import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";
import { AgentCard } from "@/components/agent-flow/AgentCard";
import { AgentDialog } from "@/components/agent-flow/AgentDialog";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const defaultAgents: Agent[] = [
  {
    id: "welcome",
    name: "Welcome Sen",
    type: "welcome",
    systemRole: "You are a friendly, proactive assistant designed to greet users and offer initial assistance on the website or app.",
    prompt: "Hi there! Welcome to [Your Company Name]. How can I assist you today? You can ask me about our products, services, or anything else you need help with!",
    features: [
      "Detects user behavior",
      "Proactively suggests categories",
      "Personalizes greetings"
    ]
  },
  {
    id: "sales",
    name: "Sales Sen",
    type: "sales",
    systemRole: "You are a persuasive yet helpful assistant skilled at upselling and cross-selling products based on the user's preferences and browsing history.",
    prompt: "I noticed you're interested in [specific product or category]. Would you like to see related products or learn about special offers?",
    features: [
      "Recommends products based on history",
      "Offers discounts and bundles",
      "Drives conversions"
    ]
  },
  {
    id: "knowledge",
    name: "Knowledge Sen",
    type: "knowledge",
    systemRole: "You are a highly capable assistant with access to a retrieval-augmented generation (RAG) system. You retrieve relevant information from a database or documents to answer complex queries.",
    prompt: "What specific information are you looking for? I can help by retrieving the most relevant documents or guides for you.",
    features: [
      "Uses RAG for document retrieval",
      "Generates accurate summaries",
      "Provides contextual answers"
    ]
  },
  {
    id: "support",
    name: "Support Sen",
    type: "support",
    systemRole: "You are a caring and insightful assistant that provides personalized support tailored to the user's history and preferences.",
    prompt: "Hi [Customer Name], welcome back! I see you've recently interacted with [Product/Service]. How can I assist you further with that today?",
    features: [
      "Leverages user history",
      "Builds rapport with users",
      "Provides tailored support"
    ]
  }
];

const AgentFlow = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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
        systemRole: agent.system_role, // Map database column to frontend property
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
        system_role: defaultAgent.systemRole, // Map frontend property to database column
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
        systemRole: data.system_role, // Map database column to frontend property
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
        system_role: updatedAgent.systemRole, // Map frontend property to database column
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
            <h1 className="text-3xl font-bold">Agent Flow</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Design and manage your agent workflows
            </p>
          </div>
        </div>

        {/* Main Agent Box with Hierarchy Lines */}
        <div className="flex flex-col items-center gap-4 mb-8 relative">
          <Card className="w-48 h-48 p-4 flex flex-col items-center justify-center text-center border-2 bg-primary/10">
            <h3 className="font-semibold mb-2">Mahasen</h3>
          </Card>
          <ArrowDown className="h-8 w-8 text-slate-400" />
          
          {/* Agent Grid with Dotted Lines */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Vertical dotted line from Mahasen */}
            <div className="absolute -top-12 left-1/2 w-px h-12 border-l-2 border-dotted border-gray-300 dark:border-gray-700" />
            
            {/* Horizontal dotted line */}
            <div className="absolute top-24 left-0 w-full h-px border-t-2 border-dotted border-gray-300 dark:border-gray-700" />

            {defaultAgents.map((defaultAgent) => {
              const existingAgent = agents.find(a => a.type === defaultAgent.type);
              return (
                <div key={defaultAgent.id} className="flex flex-col items-center">
                  {/* Vertical dotted line to each agent */}
                  <div className="h-24 w-px border-l-2 border-dotted border-gray-300 dark:border-gray-700 mb-4" />
                  <AgentCard
                    agent={existingAgent || defaultAgent}
                    isActive={!!existingAgent}
                    onClick={() => {
                      setSelectedAgent(existingAgent || defaultAgent);
                      setIsDialogOpen(true);
                    }}
                  />
                </div>
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
