import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PlatformChats from "./pages/PlatformChats";
import ChatConversation from "./pages/ChatConversation";
import About from "./pages/About";
import KnowledgeBase from "./pages/KnowledgeBase";
import AISettings from "./pages/AISettings";
import AgentFlow from "./pages/AgentFlow";
import Tickets from "./pages/Tickets";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      networkMode: "always",
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const authChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastAuthEvent = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  const handleAuthChange = useCallback((authenticated: boolean, event?: string) => {
    // Prevent handling the same event type in quick succession
    if (lastAuthEvent.current === event && event !== 'SIGNED_OUT') {
      return;
    }

    // Clear any pending auth updates
    if (authChangeTimeout.current) {
      clearTimeout(authChangeTimeout.current);
    }

    lastAuthEvent.current = event || null;

    // Set a small delay to prevent rapid state updates
    authChangeTimeout.current = setTimeout(() => {
      setIsAuthenticated((current) => {
        // Only update if the authentication state actually changed
        if (current !== authenticated) {
          if (!authenticated) {
            queryClient.clear();
          }
          return authenticated;
        }
        return current;
      });

      // Only show toast for explicit sign-out
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
      }
    }, 100);
  }, [toast]);

  // Initial session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          handleAuthChange(false);
          return;
        }

        handleAuthChange(!!session);
      } catch (error) {
        console.error("Session check error:", error);
        handleAuthChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isInitialMount.current) {
      checkSession();
      isInitialMount.current = false;
    }

    return () => {
      if (authChangeTimeout.current) {
        clearTimeout(authChangeTimeout.current);
      }
    };
  }, [handleAuthChange]);

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);

      switch (event) {
        case 'SIGNED_OUT':
          handleAuthChange(false, event);
          break;

        case 'SIGNED_IN':
          handleAuthChange(true, event);
          break;

        case 'TOKEN_REFRESHED':
          // Don't update state for token refresh
          console.log('Token refreshed successfully');
          break;

        case 'USER_UPDATED':
          if (isAuthenticated !== !!session) {
            handleAuthChange(!!session, event);
          }
          break;

        default:
          // Only update state if it's different from current
          if (isAuthenticated !== !!session) {
            handleAuthChange(!!session, event);
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthChange, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
              <Route
                path="/signup"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
                }
              />
              <Route path="/about" element={<About />} />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  isAuthenticated ? (
                    <KnowledgeBase />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/agent-flow"
                element={
                  isAuthenticated ? (
                    <AgentFlow />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/tickets"
                element={
                  isAuthenticated ? (
                    <Tickets />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/ai-settings"
                element={
                  isAuthenticated ? (
                    <AISettings />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/chats/:platform"
                element={
                  isAuthenticated ? (
                    <PlatformChats />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/chat/:id"
                element={
                  isAuthenticated ? (
                    <ChatConversation />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;