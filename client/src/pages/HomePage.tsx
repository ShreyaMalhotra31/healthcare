import Dashboard from "@/components/Dashboard";
import QuickActions from "@/components/QuickActions";
import HighRiskPatients from "@/components/HighRiskPatients";
import VirtualAssistant from "@/components/VirtualAssistant";

const HomePage = () => {
  return (
    <>
      <Dashboard />
      <QuickActions />
      <HighRiskPatients />
      <VirtualAssistant />
    </>
  );
};

export default HomePage;
