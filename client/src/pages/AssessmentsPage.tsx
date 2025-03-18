import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext, ModalContext } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AssessmentsPage = () => {
  const { user } = useContext(UserContext);
  const { setShowPregnancyAssessment, setShowChildHealthAssessment } = useContext(ModalContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("pregnancy");
  
  // Get patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowPregnancyAssessment(true)}
            className="bg-primary text-white"
            size="sm"
          >
            <span className="material-icons text-sm mr-1">add</span>
            New Pregnancy Assessment
          </Button>
          <Button
            onClick={() => setShowChildHealthAssessment(true)}
            className="bg-secondary text-white"
            size="sm"
          >
            <span className="material-icons text-sm mr-1">add</span>
            New Child Assessment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pregnancy" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pregnancy">Pregnancy Assessments</TabsTrigger>
          <TabsTrigger value="child">Child Assessments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pregnancy">
          {isLoadingPatients ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : patients?.filter((p: any) => p.healthConcern === "Pregnancy").length > 0 ? (
            <div className="space-y-4">
              {patients
                .filter((p: any) => p.healthConcern === "Pregnancy")
                .map((patient: any) => (
                  <AssessmentCard
                    key={patient.id}
                    patient={patient}
                    type="pregnancy"
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="material-icons text-4xl text-neutral-400 mb-2">
                pregnant_woman
              </span>
              <h3 className="text-lg font-medium mb-2">No pregnancy assessments yet</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Start by creating a new pregnancy assessment
              </p>
              <Button
                onClick={() => setShowPregnancyAssessment(true)}
                className="bg-primary text-white"
              >
                New Assessment
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="child">
          {isLoadingPatients ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : patients?.filter((p: any) => p.healthConcern === "Child Health").length > 0 ? (
            <div className="space-y-4">
              {patients
                .filter((p: any) => p.healthConcern === "Child Health")
                .map((patient: any) => (
                  <AssessmentCard
                    key={patient.id}
                    patient={patient}
                    type="child"
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="material-icons text-4xl text-neutral-400 mb-2">
                child_care
              </span>
              <h3 className="text-lg font-medium mb-2">No child assessments yet</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Start by creating a new child health assessment
              </p>
              <Button
                onClick={() => setShowChildHealthAssessment(true)}
                className="bg-primary text-white"
              >
                New Assessment
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AssessmentCardProps {
  patient: any;
  type: "pregnancy" | "child";
}

const AssessmentCard = ({ patient, type }: AssessmentCardProps) => {
  // Risk level badge color
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{patient.name}</CardTitle>
          <span
            className={`${getRiskBadgeClass(
              patient.riskLevel
            )} text-xs px-2 py-0.5 rounded-full`}
          >
            {patient.riskLevel.charAt(0).toUpperCase() + patient.riskLevel.slice(1)} Risk
          </span>
        </div>
        <CardDescription>
          {patient.age} years • Last assessment:{" "}
          {new Date(patient.lastVisitDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Address:</span> {patient.address}
          </div>
          {patient.contactNumber && (
            <div className="text-sm">
              <span className="font-medium">Contact:</span> {patient.contactNumber}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/10"
        >
          <span className="material-icons text-sm mr-1">history</span>
          View History
        </Button>
        <Button
          size="sm"
          className="bg-primary text-white"
        >
          <span className="material-icons text-sm mr-1">add</span>
          New Assessment
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AssessmentsPage;
