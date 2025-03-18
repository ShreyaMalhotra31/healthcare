import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext, ModalContext, ConnectionContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { processChildHealthAssessment } from "@/lib/openai";
import { 
  startSpeechRecognition, 
  stopSpeechRecognition, 
  isSpeechRecognitionSupported 
} from "@/lib/speechUtils";
import { X } from "lucide-react";
import { addPendingSync } from "@/lib/indexedDB";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const childHealthAssessmentSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  weight: z.string().transform(val => parseInt(val, 10)).optional(),
  height: z.string().transform(val => parseInt(val, 10)).optional(),
  hemoglobinLevel: z.string().transform(val => parseFloat(val)).optional(),
  symptoms: z.array(z.string()),
});

type ChildHealthAssessmentFormValues = z.infer<typeof childHealthAssessmentSchema>;

// Symptoms checklist
const childHealthSymptoms = [
  "Pale skin",
  "Fatigue",
  "Weakness",
  "Irritability",
  "Delayed growth",
  "Poor appetite",
  "Frequent infections",
  "Dizziness/fainting",
  "Rapid heartbeat",
  "Difficulty breathing",
];

const ChildHealthAssessment = () => {
  const { user } = useContext(UserContext);
  const { setShowChildHealthAssessment } = useContext(ModalContext);
  const { isOnline } = useContext(ConnectionContext);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState("");
  
  // Get patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !!user,
  });
  
  // Filter only child patients
  const childPatients = patients?.filter((patient: any) => 
    patient.age <= 12
  );
  
  // Initialize form
  const form = useForm<ChildHealthAssessmentFormValues>({
    resolver: zodResolver(childHealthAssessmentSchema),
    defaultValues: {
      patientId: "",
      weight: "",
      height: "",
      hemoglobinLevel: "",
      symptoms: [],
    },
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (data: ChildHealthAssessmentFormValues) => {
      if (!isOnline) {
        // Store for syncing later
        await addPendingSync("/api/child-health-assessments", "POST", data);
        return { riskLevel: "pending", recommendations: "Will be processed when online" };
      }
      
      return processChildHealthAssessment(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/high-risk-patients"] });
      
      // Show risk level in toast
      const riskColor = data.riskLevel === "high" ? "destructive" : 
                     data.riskLevel === "medium" ? "warning" : "default";
      
      toast({
        title: `Assessment completed: ${data.riskLevel.toUpperCase()} risk detected`,
        description: data.recommendations.slice(0, 100) + (data.recommendations.length > 100 ? "..." : ""),
        variant: riskColor as any,
      });
      
      setShowChildHealthAssessment(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process assessment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ChildHealthAssessmentFormValues) => {
    submitAssessmentMutation.mutate(data);
  };
  
  // Handle voice input
  const startVoiceAssessment = () => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    setIsVoiceMode(true);
    setVoicePrompt("Please describe the child's health status including weight, height, symptoms, and any concerns");
    
    const lang = "en-IN";
    setIsListening(true);
    
    startSpeechRecognition(
      lang,
      (text) => {
        setIsListening(false);
        // Process the voice input
        processVoiceInput(text);
      },
      (error) => {
        toast({
          title: "Voice Recognition Error",
          description: error,
          variant: "destructive",
        });
        setIsListening(false);
      }
    );
  };
  
  // Process voice input (simplified - a real implementation would use NLP)
  const processVoiceInput = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract weight
    const weightMatch = lowerText.match(/(\d+)\s*kg/);
    if (weightMatch) {
      // Convert kg to grams
      const weightKg = parseInt(weightMatch[1], 10);
      form.setValue("weight", (weightKg * 1000).toString());
    }
    
    // Extract height
    const heightMatch = lowerText.match(/(\d+)\s*cm/);
    if (heightMatch) {
      form.setValue("height", heightMatch[1]);
    }
    
    // Check for symptoms
    const newSymptoms: string[] = [];
    childHealthSymptoms.forEach(symptom => {
      if (lowerText.includes(symptom.toLowerCase())) {
        newSymptoms.push(symptom);
      }
    });
    
    if (newSymptoms.length > 0) {
      form.setValue("symptoms", newSymptoms);
    }
    
    // Try to extract hemoglobin level
    const hemoglobinMatch = lowerText.match(/hemoglobin\s*(\d+(\.\d+)?)/);
    if (hemoglobinMatch) {
      form.setValue("hemoglobinLevel", hemoglobinMatch[1]);
    }
    
    // Show extracted information
    toast({
      title: "Voice input processed",
      description: "Please review and complete any missing information",
    });
    
    setIsVoiceMode(false);
  };
  
  // Cancel voice mode
  const cancelVoiceMode = () => {
    stopSpeechRecognition();
    setIsListening(false);
    setIsVoiceMode(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Child Health Assessment</h2>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={() => setShowChildHealthAssessment(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          {isVoiceMode ? (
            // Voice assessment mode
            <div>
              <div className="mb-6 text-center">
                <p className="text-sm mb-4">{voicePrompt}</p>
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${isListening ? "bg-primary text-white animate-pulse" : "bg-neutral-100"}`}>
                  <span className="material-icons text-3xl">mic</span>
                </div>
                <p className="text-sm font-medium">
                  {isListening ? "Listening..." : "Processing..."}
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={cancelVoiceMode}
              >
                Cancel Voice Input
              </Button>
            </div>
          ) : (
            // Form input mode
            <>
              <div className="mb-6">
                <p className="text-sm mb-3">Fill details or use voice input for quick assessment</p>
                <Button
                  type="button"
                  className="bg-primary/10 text-primary rounded-full py-2 px-4 w-full flex items-center justify-center"
                  onClick={startVoiceAssessment}
                >
                  <span className="material-icons mr-2">mic</span>
                  Start Voice Assessment
                </Button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Child</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select or add new patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPatients ? (
                              <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                            ) : childPatients?.length > 0 ? (
                              <>
                                {childPatients.map((patient: any) => (
                                  <SelectItem key={patient.id} value={patient.id.toString()}>
                                    {patient.name} ({patient.age} yrs)
                                  </SelectItem>
                                ))}
                              </>
                            ) : (
                              <SelectItem value="none" disabled>No child patients found</SelectItem>
                            )}
                            <SelectItem value="new">+ Add New Patient</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (grams)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 12500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 85"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="hemoglobinLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hemoglobin Level (g/dL)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 11.5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>Symptoms (select all that apply)</FormLabel>
                        </div>
                        <div className="space-y-2">
                          {childHealthSymptoms.map((symptom) => (
                            <FormField
                              key={symptom}
                              control={form.control}
                              name="symptoms"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={symptom}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(symptom)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, symptom])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== symptom
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {symptom}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6">
                    <Button
                      type="submit"
                      className="w-full bg-primary text-white py-3 rounded-lg font-medium"
                      disabled={submitAssessmentMutation.isPending}
                    >
                      {submitAssessmentMutation.isPending ? (
                        <span className="flex items-center">
                          <span className="material-icons animate-spin mr-2">autorenew</span>
                          Processing...
                        </span>
                      ) : (
                        "Run AI Assessment"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildHealthAssessment;
