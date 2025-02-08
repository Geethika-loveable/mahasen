
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, CircleDot } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useEffect } from "react";
import { toast } from "sonner";

type Platform = Database["public"]["Enums"]["platform_type"];
const validPlatforms: Platform[] = ["whatsapp", "facebook", "instagram"];

interface Conversation {
  id: string;
  contact_name: string;
  contact_number: string;
  updated_at: string;
  platform: Platform;
  has_unread: boolean;
  latest_message_time: string;
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

    console.log('Setting up real-time subscription for messages');

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          
          // Immediately invalidate and refetch conversations
          queryClient.invalidateQueries({ 
            queryKey: ["conversations", platform],
            exact: true
          });

          // Show notification for new messages
          if (payload.eventType === 'INSERT' && payload.new.status === 'received') {
            toast.success(`New message from ${payload.new.sender_name}`);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages updates');
        }
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

      // Get conversations with their latest message timestamp
      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select(`
          *,
          messages:messages (
            created_at,
            read,
            status
          )
        `)
        .eq("platform", platform);

      if (conversationsError) throw conversationsError;

      // Process the conversations to include latest message time and unread status
      const processedConversations = conversationsData.map(conversation => {
        const messages = conversation.messages || [];
        const latestMessage = messages.reduce((latest: any, current: any) => {
          return !latest || new Date(current.created_at) > new Date(latest.created_at)
            ? current
            : latest;
        }, null);

        // Check for unread messages that are received (from user)
        const hasUnread = messages.some((msg: any) => !msg.read && msg.status === 'received');

        return {
          ...conversation,
          has_unread: hasUnread,
          latest_message_time: latestMessage ? latestMessage.created_at : conversation.created_at
        };
      });

      // Sort by latest message time
      return processedConversations.sort((a, b) => 
        new Date(b.latest_message_time).getTime() - new Date(a.latest_message_time).getTime()
      );
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
      <div className="min-h-screen bg-[#F1F0FB] dark:bg-slate-900 p-6">
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
    <div className="min-h-screen bg-[#F1F0FB] dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="secondary"
            className="mr-4 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
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
                      {new Date(conversation.latest_message_time).toLocaleDateString()}
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
