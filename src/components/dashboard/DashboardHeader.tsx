
import { Button } from "@/components/ui/button";
import { Settings, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  userName: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  onDevModeChange: (isDevMode: boolean) => void;
}

export const DashboardHeader = ({ userName, onNavigate, onSignOut, onDevModeChange }: DashboardHeaderProps) => {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('ui_mode')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setIsDevMode(data.ui_mode === 'dev');
        onDevModeChange(data.ui_mode === 'dev');
      } else {
        // Create default preferences if none exist
        await supabase.from('user_preferences').insert({
          user_id: user.id,
          ui_mode: 'full'
        });
      }
    };

    fetchUserPreferences();
  }, []);

  const toggleDevMode = async () => {
    const newMode = !isDevMode;
    setIsDevMode(newMode);
    onDevModeChange(newMode);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ui_mode: newMode ? 'dev' : 'full'
      });
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Mahasen AI</h1>
        <p className="text-slate-600 dark:text-slate-400">Welcome, {userName}</p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={toggleDevMode}
          className="flex items-center gap-2"
        >
          {isDevMode ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Dev Mode
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Dev Mode
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate("/ai-settings")}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          AI Settings
        </Button>
        <ThemeToggle />
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};
