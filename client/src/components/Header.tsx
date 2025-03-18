import { useContext, useState } from "react";
import { UserContext, ConnectionContext } from "@/App";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";

const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const { isOnline } = useContext(ConnectionContext);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(newLang);
    toast({
      title: "Language changed",
      description: newLang === "en" ? "Language set to English" : "भाषा हिंदी में सेट की गई",
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setLocation("/");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="material-icons">health_and_safety</span>
          <h1 className="text-xl font-semibold">{t("app_name")}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {!isOnline && (
            <span className="offline-indicator text-xs bg-warning text-neutral-800 px-2 py-1 rounded-full flex items-center">
              <span className="material-icons text-sm mr-1">wifi_off</span>
              {t("offline")}
            </span>
          )}
          <button
            className="flex items-center text-sm"
            onClick={toggleLanguage}
          >
            <span className="material-icons text-sm mr-1">translate</span>
            {t("language")}
          </button>
          <div className="relative">
            <button
              className="flex items-center text-sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="material-icons">person</span>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-800">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-neutral-600">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
