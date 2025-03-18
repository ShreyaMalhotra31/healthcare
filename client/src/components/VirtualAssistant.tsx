import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext, ConnectionContext } from "@/App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { processChatMessage } from "@/lib/openai";
import { Loader2, Mic, Send, Timer, Volume2, Languages, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from "@/lib/speechUtils";
import { saveChatMessageOffline, getChatHistoryOffline } from "@/lib/indexedDB";

const VirtualAssistant = () => {
  const { user } = useContext(UserContext);
  const { isOnline } = useContext(ConnectionContext);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      userId: user?.id || 0,
      message: "Namaste! I'm your health assistant. I can help with pregnancy assessments, anemia detection, and finding government healthcare schemes. How can I help you today?",
      isUserMessage: false,
      timestamp: new Date().toISOString(),
      relatedPatientId: null,
    }
  ]);
  
  // Define an interface for chat messages
  interface ChatMessage {
    id: number;
    userId: number;
    message: string;
    isUserMessage: boolean;
    timestamp: string;
    relatedPatientId?: number | null;
  }

  // Get chat messages
  const { data: chatMessages, isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat-history"],
    enabled: !!user && isOnline,
  });
  
  // Use local messages if offline
  const [offlineMessages, setOfflineMessages] = useState<ChatMessage[]>([]);
  
  useEffect(() => {
    if (!isOnline) {
      getChatHistoryOffline().then(messages => {
        if (messages && Array.isArray(messages) && messages.length > 0) {
          setOfflineMessages(messages as ChatMessage[]);
        }
      });
    }
  }, [isOnline]);
  
  // Combine server messages or use offline messages
  const messages: ChatMessage[] = isOnline && chatMessages ? chatMessages : 
                  (offlineMessages.length > 0 ? offlineMessages : localMessages);
  
  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!isOnline) {
        // Save message offline
        await saveChatMessageOffline(message, true);
        
        // Generate a simple offline response
        const offlineResponse = "I'm currently offline. I'll process your question when you're back online.";
        await saveChatMessageOffline(offlineResponse, false);
        
        return offlineResponse;
      }
      
      return processChatMessage(message);
    },
    onSuccess: (response, variables) => {
      // Update local messages if server messages are not available
      if (!chatMessages) {
        setLocalMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            userId: user?.id || 0,
            message: variables,
            isUserMessage: true,
            timestamp: new Date().toISOString(),
            relatedPatientId: null,
          },
          {
            id: prev.length + 2,
            userId: user?.id || 0,
            message: response,
            isUserMessage: false,
            timestamp: new Date().toISOString(),
            relatedPatientId: null,
          }
        ]);
      } else {
        // Update query cache with new message
        queryClient.invalidateQueries({ queryKey: ["/api/chat-history"] });
      }
      
      // Read out response if speaking enabled
      if (isSpeaking) {
        const lang = i18n.language === "en" ? "en-IN" : "hi-IN";
        speakText(response, lang);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);
  
  // Function to send a message
  const sendMessage = () => {
    if (!question.trim() || sendMessageMutation.isPending) {
      return;
    }
    
    sendMessageMutation.mutate(question);
    setQuestion("");
  };
  
  // Function to toggle voice input
  const toggleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    if (isListening) {
      setIsListening(false);
      stopSpeechRecognition();
    } else {
      setIsListening(true);
      const lang = i18n.language === "en" ? "en-IN" : "hi-IN";
      
      startSpeechRecognition(
        lang,
        (text) => {
          setQuestion(text);
          setIsListening(false);
        },
        (error) => {
          toast({
            title: "Voice Recognition Error",
            description: error,
            variant: "destructive",
          });
          setIsListening(false);
        }
      );
    }
  };
  
  // Function to toggle text-to-speech
  const toggleSpeaking = () => {
    if (!isSpeechSynthesisSupported()) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    if (isSpeaking) {
      stopSpeaking();
    }
    
    setIsSpeaking(!isSpeaking);
  };
  
  // Function to toggle translation
  const toggleTranslation = () => {
    setTranslateEnabled(!translateEnabled);
    toast({
      title: translateEnabled ? "Translation Disabled" : "Translation Enabled",
      description: translateEnabled
        ? "Messages will no longer be translated"
        : "Messages will be translated to the selected language",
    });
  };

  return (
    <section className="mb-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold mb-1">AI Health Assistant</h3>
          <p className="text-sm text-neutral-600">Ask questions about healthcare, assessments, or schemes</p>
        </div>

        <div className="p-4 max-h-64 overflow-y-auto space-y-4" id="chat-messages">
          {isLoadingMessages ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg, index) => (
              msg.isUserMessage ? (
                <UserMessage key={index} message={msg.message} />
              ) : (
                <AssistantMessage key={index} message={msg.message} />
              )
            ))
          ) : (
            <AssistantMessage message="Namaste! I'm your health assistant. I can help with pregnancy assessments, anemia detection, and finding government healthcare schemes. How can I help you today?" />
          )}
          
          {sendMessageMutation.isPending && (
            <AssistantMessage message="..." isLoading={true} />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center bg-neutral-100 p-2 rounded-lg">
            <button
              type="button"
              className={`p-2 rounded-full ${isListening ? "bg-accent text-white" : "hover:bg-neutral-200"}`}
              onClick={toggleVoiceInput}
            >
              <Mic size={18} className={isListening ? "text-white" : "text-neutral-600"} />
            </button>
            <input
              type="text"
              className="flex-grow bg-transparent px-3 py-2 focus:outline-none text-sm text-neutral-800"
              placeholder={isListening ? "Listening..." : "Type or speak your question..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={isListening}
            />
            <button
              type="button"
              className={`p-2 rounded-full ${!question.trim() || sendMessageMutation.isPending ? "bg-neutral-300 text-neutral-500" : "bg-primary text-white"}`}
              onClick={sendMessage}
              disabled={!question.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? 
                <Timer size={18} /> : 
                <Send size={18} />
              }
            </button>
          </div>
          <div className="flex justify-between mt-3 px-1">
            <div className="flex space-x-4">
              <button
                type="button"
                className={`text-xs ${translateEnabled ? "text-accent" : "text-primary"} flex items-center`}
                onClick={toggleTranslation}
              >
                <Languages size={14} className="mr-1" />
                Translate
              </button>
              <button
                type="button"
                className={`text-xs ${isSpeaking ? "text-accent" : "text-primary"} flex items-center`}
                onClick={toggleSpeaking}
              >
                <Volume2 size={14} className="mr-1" />
                Listen
              </button>
            </div>
            <div className="text-xs text-neutral-600">
              {i18n.language === "en" ? "Hindi" : "English"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface MessageProps {
  message: string;
  isLoading?: boolean;
}

const UserMessage = ({ message }: MessageProps) => {
  return (
    <div className="flex items-start justify-end">
      <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none max-w-[85%]">
        <p className="text-sm">{message}</p>
      </div>
      <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 flex-shrink-0">
        <User size={16} />
      </div>
    </div>
  );
};

const AssistantMessage = ({ message, isLoading }: MessageProps) => {
  return (
    <div className="flex items-start">
      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
        <Bot size={16} />
      </div>
      <div className="bg-neutral-100 p-3 rounded-lg rounded-tl-none max-w-[85%]">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <p className="text-sm whitespace-pre-line">{message}</p>
        )}
      </div>
    </div>
  );
};

export default VirtualAssistant;
