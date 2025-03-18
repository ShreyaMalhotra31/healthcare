import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { ConnectionContext } from "@/App";
import { synchronizeData, getCachedPatients } from "@/lib/indexedDB";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const Footer = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOnline, pendingSyncs } = useContext(ConnectionContext);

  const handleSyncData = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot sync",
        description: "You are currently offline. Please connect to the internet to sync data.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Syncing data",
      description: "Synchronizing offline data with the server...",
    });

    try {
      await synchronizeData(apiRequest);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/high-risk-patients"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/chat-history"] });
      
      toast({
        title: "Sync complete",
        description: "Your data has been successfully synchronized.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to synchronize data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadOfflineData = async () => {
    toast({
      title: "Preparing offline data",
      description: "Downloading latest data for offline use...",
    });

    try {
      // Fetch data that should be available offline
      const patientsResponse = await fetch("/api/patients", {
        credentials: "include",
      });
      
      if (!patientsResponse.ok) {
        throw new Error("Failed to fetch patients data");
      }
      
      const patients = await patientsResponse.json();
      
      // Store in IndexedDB
      const { cachePatients } = await import("@/lib/indexedDB");
      await cachePatients(patients);
      
      toast({
        title: "Offline data ready",
        description: `${patients.length} patients available for offline use`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to prepare offline data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSupport = () => {
    toast({
      title: "Support",
      description: "Contact support at support@svasthyasaathi.org or call our helpline at 1800-XXX-XXXX",
    });
  };

  return (
    <footer className="bg-white border-t border-neutral-200 py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-around">
          <button
            className="text-xs text-neutral-800 flex flex-col items-center"
            onClick={handleSyncData}
          >
            <span className="material-icons text-lg">sync</span>
            <span>{t("sync_data")}</span>
          </button>
          <button
            className="text-xs text-neutral-800 flex flex-col items-center"
            onClick={handleDownloadOfflineData}
          >
            <span className="material-icons text-lg">download</span>
            <span>{t("offline_data")}</span>
          </button>
          <button
            className="text-xs text-neutral-800 flex flex-col items-center"
            onClick={handleSupport}
          >
            <span className="material-icons text-lg">support_agent</span>
            <span>{t("support")}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
