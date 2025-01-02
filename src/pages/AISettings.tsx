import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AITone } from "@/types/ai";

const AISettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tone, setTone] = useState<AITone>("Professional");
  const [behaviour, setBehaviour] = useState("");
  const [contextMemoryLength, setContextMemoryLength] = useState<string>("2");
  const [conversationTimeout, setConversationTimeout] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_settings')
          .select('*')
          .single();

        if (error) throw error;

        if (data) {
          setTone(data.tone as AITone);
          setBehaviour(data.behaviour || "");
          setContextMemoryLength(data.context_memory_length?.toString() || "2");
          setConversationTimeout(data.conversation_timeout_hours || 1);
        }
      } catch (error) {
        console.error('Error loading AI settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load AI settings. Please try again.",
        });
      }
    };

    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert({ 
          id: 1,
          tone,
          behaviour,
          context_memory_length: contextMemoryLength === "Disable" ? 0 : parseInt(contextMemoryLength),
          conversation_timeout_hours: conversationTimeout,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "AI settings have been updated successfully.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save AI settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">AI Settings</h1>
        </div>

        <div className="space-y-8 bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
          <div className="space-y-4">
            <label className="text-lg font-medium">AI Tone</label>
            <Select 
              value={tone} 
              onValueChange={(value: string) => setTone(value as AITone)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
                <SelectItem value="Empathetic">Empathetic</SelectItem>
                <SelectItem value="Playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <label className="text-lg font-medium">AI Behaviour</label>
            <Textarea
              value={behaviour}
              onChange={(e) => setBehaviour(e.target.value)}
              placeholder="Define how the AI should behave when answering customer inquiries..."
              className="min-h-[150px]"
              maxLength={500}
            />
            <p className="text-sm text-slate-500">
              {behaviour.length}/500 characters
            </p>
          </div>

          <div className="space-y-4 border-2 border-red-500 rounded-lg p-4">
            <h2 className="text-lg font-medium">Advanced Settings</h2>
            
            <div className="space-y-4">
              <label className="text-sm font-medium">Context Memory Length</label>
              <RadioGroup
                value={contextMemoryLength}
                onValueChange={setContextMemoryLength}
                className="flex flex-wrap gap-4"
              >
                {["1", "2", "3", "5", "Disable"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`memory-${value}`} />
                    <Label htmlFor={`memory-${value}`}>{value}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                New Conversation Timeout (hours)
              </label>
              <Input
                type="number"
                min={1}
                max={6}
                value={conversationTimeout}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 6) {
                    setConversationTimeout(value);
                  }
                }}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Set between 1-6 hours
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;