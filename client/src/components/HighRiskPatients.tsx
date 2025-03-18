import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const HighRiskPatients = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  
  const { data: highRiskPatients, isLoading } = useQuery({
    queryKey: ["/api/high-risk-patients"],
    enabled: !!user,
  });

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium">{t("high_risk_patients")}</h3>
        <Link href="/patients" className="text-primary text-sm font-medium">
          {t("view_all")}
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array(2)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
        ) : highRiskPatients?.length > 0 ? (
          // Patient list
          highRiskPatients.map((patient: any) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          // Empty state
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <p className="text-sm text-neutral-800">
              No high-risk patients found
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

interface PatientCardProps {
  patient: any;
}

const PatientCard = ({ patient }: PatientCardProps) => {
  const { t } = useTranslation();
  
  // Determine risk level badge color
  const getRiskBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-danger text-white";
      case "medium":
        return "bg-warning text-neutral-800";
      default:
        return "bg-success text-white";
    }
  };
  
  // Format health concern for display
  const formatHealthConcern = (concern: string) => {
    switch (concern) {
      case "Pregnancy":
        return t("pregnant");
      case "Child Health":
        return t("child");
      default:
        return concern;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium">{patient.name}</h4>
        <span
          className={`${getRiskBadgeClass(
            patient.riskLevel
          )} text-xs px-2 py-0.5 rounded-full`}
        >
          {patient.riskLevel === "high" ? t("high_risk") : t("medium_risk")}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm mb-3">
        <div className="flex items-center text-neutral-800">
          <span className="material-icons text-xs mr-1">
            {patient.healthConcern === "Pregnancy"
              ? "pregnant_woman"
              : "child_care"}
          </span>
          <span>{formatHealthConcern(patient.healthConcern)}</span>
        </div>
        <span className="text-neutral-800">{patient.age} yrs</span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-danger">{patient.riskReason}</p>
        <button className="text-primary text-sm flex items-center">
          <span className="material-icons text-sm mr-1">phone</span>
          {t("call")}
        </button>
      </div>
    </div>
  );
};

export default HighRiskPatients;
