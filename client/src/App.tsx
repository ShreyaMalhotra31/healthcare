import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import AppShell from "@/components/AppShell";
import HomePage from "@/pages/HomePage";
import AssessmentsPage from "@/pages/AssessmentsPage";
import PatientsPage from "@/pages/PatientsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import PregnancyAssessment from "@/components/modals/PregnancyAssessment";
import SchemeFinder from "@/components/modals/SchemeFinder";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "./lib/queryClient";
import { setupIndexedDB } from "./lib/indexedDB";

// Context imports
import { createContext } from "react";

// User Context
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  location: string;
}

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

// Modal Context
interface ModalContextType {
  showPregnancyAssessment: boolean;
  setShowPregnancyAssessment: (show: boolean) => void;
  showSchemeFinder: boolean;
  setShowSchemeFinder: (show: boolean) => void;
  showChildHealthAssessment: boolean;
  setShowChildHealthAssessment: (show: boolean) => void;
}

export const ModalContext = createContext<ModalContextType>({
  showPregnancyAssessment: false,
  setShowPregnancyAssessment: () => {},
  showSchemeFinder: false,
  setShowSchemeFinder: () => {},
  showChildHealthAssessment: false,
  setShowChildHealthAssessment: () => {},
});

// Connection Context
export interface ConnectionContextType {
  isOnline: boolean;
  pendingSyncs: number;
}

export const ConnectionContext = createContext<ConnectionContextType>({
  isOnline: true,
  pendingSyncs: 0,
});

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/assessments" component={AssessmentsPage} />
      <Route path="/patients" component={PatientsPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Modal state
  const [showPregnancyAssessment, setShowPregnancyAssessment] = useState(false);
  const [showSchemeFinder, setShowSchemeFinder] = useState(false);
  const [showChildHealthAssessment, setShowChildHealthAssessment] = useState(false);
  
  // Connection state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  
  // Initialize IndexedDB for offline storage
  useEffect(() => {
    setupIndexedDB().catch(error => {
      console.error("Failed to initialize IndexedDB:", error);
      toast({
        title: "Error",
        description: "Failed to initialize offline storage. Some features may not work correctly.",
        variant: "destructive",
      });
    });
  }, [toast]);
  
  // Check authentication on app start
  useEffect(() => {
    async function checkAuth() {
      try {
        // Use regular fetch instead of apiRequest to avoid throwing errors
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Not authenticated, show as logged out
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        // On error, still clear the loading state and show as logged out
        setUser(null);
      } finally {
        // Always clear loading state
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connected",
        description: "You are back online",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Disconnected",
        description: "You are now offline. Changes will be synced when you reconnect.",
        variant: "destructive",
      });
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ user, setUser, loading }}>
        <ModalContext.Provider value={{
          showPregnancyAssessment,
          setShowPregnancyAssessment,
          showSchemeFinder,
          setShowSchemeFinder,
          showChildHealthAssessment,
          setShowChildHealthAssessment,
        }}>
          <ConnectionContext.Provider value={{ isOnline, pendingSyncs }}>
            <AppShell>
              <Router />
              {showPregnancyAssessment && <PregnancyAssessment />}
              {showSchemeFinder && <SchemeFinder />}
            </AppShell>
            <Toaster />
          </ConnectionContext.Provider>
        </ModalContext.Provider>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
