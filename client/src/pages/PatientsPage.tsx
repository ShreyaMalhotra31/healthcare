import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "@/App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for adding a new patient
const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().min(1, "Address is required"),
  contactNumber: z.string().optional(),
  healthConcern: z.string().min(1, "Health concern is required"),
});

type PatientFormValues = {
  name: string;
  age: string;
  gender: string;
  address: string;
  contactNumber?: string;
  healthConcern: string;
};

const PatientsPage = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Get patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });
  
  // Form for adding a new patient
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "",
      address: "",
      contactNumber: "",
      healthConcern: "",
    },
  });
  
  // Add patient mutation
  const addPatientMutation = useMutation({
    mutationFn: async (data: PatientFormValues) => {
      const patientData = {
        ...data,
        age: parseInt(data.age),
        riskLevel: "normal",
      };
      console.log("Submitting patient data:", patientData);
      const response = await apiRequest("POST", "/api/patients", patientData);
      return response;
    },
    onSuccess: (data) => {
      console.log("Patient added successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setShowAddPatient(false);
      form.reset();
      toast({
        title: "Success",
        description: "Patient added successfully",
      });
    },
    onError: (error) => {
      console.error("Error adding patient:", error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: PatientFormValues) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add patients",
        variant: "destructive",
      });
      return;
    }
    addPatientMutation.mutate(data);
  };

  // Filter patients based on active tab
  const filteredPatients = patients?.filter((patient: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "pregnancy") return patient.healthConcern === "Pregnancy";
    if (activeTab === "child") return patient.healthConcern === "Child Health";
    if (activeTab === "high-risk") return patient.riskLevel === "high";
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Button 
          onClick={() => setShowAddPatient(true)}
          className="bg-primary text-white"
        >
          <span className="material-icons text-sm mr-1">add</span>
          Add New Patient
        </Button>
      </div>

      {/* Patient tabs */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Patients</TabsTrigger>
          <TabsTrigger value="pregnancy">Pregnancy</TabsTrigger>
          <TabsTrigger value="child">Child Health</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Patient list */}
      {isLoadingPatients ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array(4).fill(0).map((_, i) => (
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
      ) : filteredPatients?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPatients.map((patient: any) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <span className="material-icons text-4xl text-neutral-400 mb-2">
            person_off
          </span>
          <h3 className="text-lg font-medium mb-2">No patients found</h3>
          <p className="text-sm text-neutral-600 mb-4">
            {activeTab === "all" 
              ? "Start by adding your first patient"
              : "No patients match the selected filter"}
          </p>
          {activeTab === "all" && (
            <Button
              onClick={() => setShowAddPatient(true)}
              className="bg-primary text-white"
            >
              Add New Patient
            </Button>
          )}
        </div>
      )}

      {/* Add patient dialog */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the patient's details to add them to your records.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Patient's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Village/Town and District" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="healthConcern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Health Concern</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pregnancy">Pregnancy</SelectItem>
                        <SelectItem value="Child Health">Child Health</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Chronic Disease">Chronic Disease</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddPatient(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-white"
                  disabled={addPatientMutation.isPending}
                >
                  {addPatientMutation.isPending ? "Adding..." : "Add Patient"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PatientCardProps {
  patient: any;
}

const PatientCard = ({ patient }: PatientCardProps) => {
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{patient.name}</CardTitle>
          {patient.riskLevel !== "normal" && (
            <span
              className={`${getRiskBadgeClass(
                patient.riskLevel
              )} text-xs px-2 py-0.5 rounded-full`}
            >
              {patient.riskLevel.charAt(0).toUpperCase() + patient.riskLevel.slice(1)} Risk
            </span>
          )}
        </div>
        <CardDescription>
          {patient.age} years • {patient.gender} • {patient.healthConcern}
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
          <div className="text-sm">
            <span className="font-medium">Last Visit:</span> {formatDate(patient.lastVisitDate)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/10"
        >
          <span className="material-icons text-sm mr-1">history</span>
          History
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

export default PatientsPage;
