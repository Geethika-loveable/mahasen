import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            setIsAuthenticated(false);
            queryClient.clear();
            
            // Only show error toast for non-refresh token errors
            if (!error.message.includes("Refresh Token Not Found")) {
              toast({
                variant: "destructive",
                title: "Session Error",
                description: "Please sign in again to continue.",
              });
            }
          }
          return;
        }
        
        if (mounted) {
          const hasValidSession = !!session;
          setIsAuthenticated(hasValidSession);
          if (!hasValidSession) {
            queryClient.clear();
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          setIsAuthenticated(false);
          queryClient.clear();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial session check
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", event);
      
      switch (event) {
        case 'SIGNED_OUT':
          setIsAuthenticated(false);
          queryClient.clear();
          toast({
            title: "Signed Out",
            description: "You have been signed out successfully.",
          });
          break;
          
        case 'SIGNED_IN':
          console.log('User signed in successfully');
          setIsAuthenticated(true);
          break;
          
        case 'TOKEN_REFRESHED':
          // Don't update state or show notifications for token refresh
          console.log('Session token refreshed successfully');
          break;
          
        case 'USER_UPDATED':
          console.log('User data updated');
          setIsAuthenticated(!!session);
          break;
          
        default:
          // Only update authentication state if it actually changed
          const newAuthState = !!session;
          if (isAuthenticated !== newAuthState) {
            setIsAuthenticated(newAuthState);
            if (!newAuthState) {
              queryClient.clear();
            }
          }
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast, isAuthenticated]); // Add isAuthenticated to dependencies

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