import { ReactNode, useContext } from "react";
import Header from "./Header";
import TabNavigation from "./TabNavigation";
import Footer from "./Footer";
import { UserContext, ConnectionContext } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { user, loading } = useContext(UserContext);
  const { isOnline } = useContext(ConnectionContext);
  const { toast } = useToast();

  // Login form state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 text-neutral-800">
        <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
        <p className="text-sm">Loading Svasthya Saathi...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabNavigation />
      <main className="flex-grow container mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
};

const LoginForm = () => {
  const { setUser } = useContext(UserContext);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Login successful",
        description: `Welcome, ${userData.fullName}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
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

              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-lg font-medium"
              >
                Login
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

export default AppShell;
