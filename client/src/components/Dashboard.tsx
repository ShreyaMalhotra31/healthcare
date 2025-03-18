import { useContext } from "react";
import { UserContext } from "@/App";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  
  // Get high risk patients to display count
  const { data: highRiskPatients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/high-risk-patients"],
    enabled: !!user,
  });
  
  // Count of today's visits (simplified - would be more complex in a real app)
  const todayVisits = highRiskPatients?.length || 0;
  
  // Count of patients needing attention (high and medium risk)
  const needsAttention = highRiskPatients?.filter(
    (patient: any) => patient.riskLevel === "high" || patient.riskLevel === "medium"
  ).length || 0;

  return (
    <section className="mb-8">
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {t("welcome")} {user?.fullName}
          </h2>
          <div className="flex items-center">
            <span className="bg-success text-white text-xs px-2.5 py-1 rounded-full">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="flex items-center mb-4">
          <div className="bg-neutral-100 rounded-full p-2 mr-3">
            <span className="material-icons text-primary">location_on</span>
          </div>
          <div>
            <p className="text-sm text-neutral-800">{user?.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-neutral-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-800">{t("today_visits")}</p>
                {isLoadingPatients ? (
                  <Skeleton className="h-6 w-6" />
                ) : (
                  <p className="text-lg font-semibold text-primary">
                    {todayVisits}
                  </p>
                )}
              </div>
              <span className="material-icons text-primary">event</span>
            </div>
          </div>
          <div className="bg-neutral-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-800">{t("needs_attention")}</p>
                {isLoadingPatients ? (
                  <Skeleton className="h-6 w-6" />
                ) : (
                  <p className="text-lg font-semibold text-danger">
                    {needsAttention}
                  </p>
                )}
              </div>
              <span className="material-icons text-danger">priority_high</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
