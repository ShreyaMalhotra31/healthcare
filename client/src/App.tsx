import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, createContext } from "react";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AssessmentsPage from "@/pages/AssessmentsPage";
import PatientsPage from "@/pages/PatientsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import PregnancyAssessment from "@/components/modals/PregnancyAssessment";
import SchemeFinder from "@/components/modals/SchemeFinder";
import ChildHealthAssessment from "@/components/modals/ChildHealthAssessment";
import { useToast } from "@/hooks/use-toast";
import { setupIndexedDB } from "./lib/indexedDB";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import Footer from "@/components/Footer";

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

// Login Form Component
const LoginForm = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Attempting login with:", { username });
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      console.log("Login response status:", response.status);
      
      const responseData = await response.json();
      console.log("Login response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Invalid credentials");
      }

      console.log("Login successful, setting user");
      onLogin(responseData);
      
      toast({
        title: "Login successful",
        description: `Welcome, ${responseData.fullName}!`,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Login failed. Please try again.");
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-800">
      <div className="bg-primary text-white shadow-md py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2">
            <span className="material-icons">health_and_safety</span>
            <h1 className="text-xl font-semibold">Svasthya Saathi</h1>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Login</h2>
            <p className="text-sm text-neutral-800 mt-1">
              Login to access the healthcare assistant
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  defaultValue="priya"
                  className="block w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  defaultValue="password123"
                  className="block w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              {loginError && (
                <div className="text-red-500 text-sm">{loginError}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-800">
              Demo: Use username "priya" and password "password123"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 text-neutral-800">
    <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
    <p className="text-sm">Loading Svasthya Saathi...</p>
  </div>
);

// Main App Layout
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <TabNavigation />
    <main className="flex-grow container mx-auto px-4 py-6">{children}</main>
    <Footer />
  </div>
);

// Router Component
function Router() {
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

// Main App Component
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
  
  // Force set loading to false after a timeout to prevent infinite loading
  useEffect(() => {
    let isMounted = true;
    
    // Check authentication on app start
    async function checkAuth() {
      try {
        console.log("Checking auth status...");
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (isMounted) setUser(userData);
        } else {
          console.log("Not authenticated, clearing user");
          if (isMounted) setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
          console.log("Auth check complete, setting loading=false");
          setLoading(false);
        }
      }
    }
    
    // Always set loading to false after a timeout
    const timer = setTimeout(() => {
      if (isMounted) {
        console.log("Loading timeout reached");
        setLoading(false);
      }
    }, 3000);
    
    checkAuth();
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
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

  // Main render logic
  let content;
  
  if (loading) {
    content = <LoadingScreen />;
  } else if (!user) {
    content = <LoginForm onLogin={setUser} />;
  } else {
    content = (
      <AppLayout>
        <Router />
        {showPregnancyAssessment && <PregnancyAssessment />}
        {showSchemeFinder && <SchemeFinder />}
        {showChildHealthAssessment && <ChildHealthAssessment />}
      </AppLayout>
    );
  }
  
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
            {content}
            <Toaster />
          </ConnectionContext.Provider>
        </ModalContext.Provider>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
