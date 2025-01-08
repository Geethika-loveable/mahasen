import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Agent {
  id: string;
  name: string;
  type: string;
  systemRole: string;
  prompt: string;
  features: string[];
}

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
    name: "Personalized Support Sen",
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

  const handleAddAgent = (defaultAgent: Agent) => {
    if (!agents.find(a => a.id === defaultAgent.id)) {
      setAgents([...agents, { ...defaultAgent }]);
    }
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(agents.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    setSelectedAgent(null);
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

        {/* Main Agent Box */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Card className="w-48 h-48 p-4 flex flex-col items-center justify-center text-center border-2">
            <h3 className="font-semibold mb-2">Mahasen</h3>
          </Card>
          <ArrowDown className="h-8 w-8 text-slate-400" />
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {defaultAgents.map((defaultAgent) => {
            const isActive = agents.some(a => a.id === defaultAgent.id);
            return (
              <div key={defaultAgent.id} className="flex flex-col items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card 
                      className={`w-48 h-48 p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                        isActive ? getAgentColor(defaultAgent.type) : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-5 w-5" />
                            <h3 className="font-semibold">{defaultAgent.name}</h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Click to edit configuration
                          </p>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center">
                          <Button variant="ghost" className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Add {defaultAgent.name}
                          </Button>
                        </div>
                      )}
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {isActive ? "Edit Agent" : "Add Agent"}: {defaultAgent.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="systemRole">System Role</Label>
                        <Textarea
                          id="systemRole"
                          defaultValue={defaultAgent.systemRole}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prompt">Default Prompt</Label>
                        <Textarea
                          id="prompt"
                          defaultValue={defaultAgent.prompt}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Features</Label>
                        <ul className="list-disc pl-4 space-y-1">
                          {defaultAgent.features.map((feature, index) => (
                            <li key={index} className="text-sm text-slate-600 dark:text-slate-400">
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        onClick={() => isActive ? handleUpdateAgent(defaultAgent) : handleAddAgent(defaultAgent)}
                        className="w-full"
                      >
                        {isActive ? "Update Agent" : "Add Agent"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentFlow;