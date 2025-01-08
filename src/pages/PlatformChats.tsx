import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, CircleDot } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useEffect } from "react";

type Platform = Database["public"]["Enums"]["platform_type"];
const validPlatforms: Platform[] = ["whatsapp", "facebook", "instagram"];

interface Conversation {
  id: string;
  contact_name: string;
  contact_number: string;
  updated_at: string;
  platform: Platform;
  has_unread: boolean;
}

const PlatformChats = () => {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Validate if the platform is valid
  const isValidPlatform = (p: string | undefined): p is Platform => {
    return !!p && validPlatforms.includes(p as Platform);
  };

  // Set up real-time subscription for message updates
  useEffect(() => {
    if (!isValidPlatform(platform)) return;

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: platform ? `platform=eq.${platform}` : undefined
        },
        () => {
          // Immediately invalidate and refetch conversations
          queryClient.invalidateQueries({ 
            queryKey: ["conversations", platform],
            exact: true
          });
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [platform, queryClient]);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", platform],
    queryFn: async () => {
      if (!isValidPlatform(platform)) {
        throw new Error("Invalid platform specified");
      }

      // Get all conversations for the platform
      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select("*")
        .eq("platform", platform)
        .order("updated_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      // For each conversation, check if there are any unread messages
      const conversationsWithUnreadStatus = await Promise.all(
        conversationsData.map(async (conversation) => {
          const { data: messages, error: messagesError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation.id)
            .eq("status", "received")
            .eq("read", false)
            .order("created_at", { ascending: false })
            .limit(1);

          if (messagesError) throw messagesError;

          return {
            ...conversation,
            has_unread: messages && messages.length > 0,
          };
        })
      );

      return conversationsWithUnreadStatus as Conversation[];
    },
    refetchOnWindowFocus: true,
  });

  const handleChatClick = async (conversationId: string) => {
    try {
      // Mark all messages as read when entering the chat
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("status", "received")
        .eq("read", false);

      if (error) {
        console.error("Error marking messages as read:", error);
      }

      // Immediately invalidate the conversations query to update UI
      queryClient.invalidateQueries({ 
        queryKey: ["conversations", platform],
        exact: true
      });

      // Navigate to the chat
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error in handleChatClick:", error);
    }
  };

  if (!isValidPlatform(platform)) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              className="mr-4"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-red-600">Invalid Platform</h1>
          </div>
          <p>The specified platform is not valid. Please select a valid platform from the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold capitalize">{platform} Chats</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading conversations...</div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-8">No conversations found</div>
        ) : (
          <div className="grid gap-4">
            {conversations?.map((conversation) => (
              <Card
                key={conversation.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleChatClick(conversation.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {conversation.contact_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {conversation.has_unread && (
                      <CircleDot className="h-4 w-4 text-green-500" />
                    )}
                    <div className="text-sm text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {conversation.contact_number}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformChats;