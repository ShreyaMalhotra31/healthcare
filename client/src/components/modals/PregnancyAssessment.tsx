import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext, ModalContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { processPregnancyAssessment } from "@/lib/openai";
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
import { ConnectionContext } from "@/App";

// Form schema
const pregnancyAssessmentSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  pregnancyWeek: z.string().transform(val => parseInt(val, 10)),
  bloodPressureSystolic: z.string().transform(val => parseInt(val, 10)).optional(),
  bloodPressureDiastolic: z.string().transform(val => parseInt(val, 10)).optional(),
  symptoms: z.array(z.string()),
  previousComplications: z.boolean().optional(),
  isFirstPregnancy: z.boolean().optional(),
});

type PregnancyAssessmentFormValues = z.infer<typeof pregnancyAssessmentSchema>;

// Symptoms checklist
const pregnancySymptoms = [
  "Swelling in hands/feet",
  "Severe headache",
  "Vision problems",
  "Abdominal pain",
  "Bleeding",
  "Reduced fetal movement",
  "Fever",
  "Dizziness/fainting",
];

const PregnancyAssessment = () => {
  const { user } = useContext(UserContext);
  const { setShowPregnancyAssessment } = useContext(ModalContext);
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
  
  // Filter only pregnancy patients
  const pregnancyPatients = patients?.filter((patient: any) => 
    patient.gender === "Female" && patient.age >= 18 && patient.age <= 45
  );
  
  // Initialize form
  const form = useForm<PregnancyAssessmentFormValues>({
    resolver: zodResolver(pregnancyAssessmentSchema),
    defaultValues: {
      patientId: "",
      pregnancyWeek: "",
      bloodPressureSystolic: "",
      bloodPressureDiastolic: "",
      symptoms: [],
      previousComplications: false,
      isFirstPregnancy: false,
    },
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (data: PregnancyAssessmentFormValues) => {
      if (!isOnline) {
        // Store for syncing later
        await addPendingSync("/api/pregnancy-assessments", "POST", data);
        return { riskLevel: "pending", recommendations: "Will be processed when online" };
      }
      
      return processPregnancyAssessment(data);
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
      
      setShowPregnancyAssessment(false);
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
  const onSubmit = (data: PregnancyAssessmentFormValues) => {
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
    setVoicePrompt("Please describe the patient's pregnancy status including weeks, symptoms, and any previous complications");
    
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
    
    // Extract pregnancy weeks
    const weekMatch = lowerText.match(/(\d+)\s*weeks?/);
    if (weekMatch) {
      form.setValue("pregnancyWeek", weekMatch[1]);
    }
    
    // Check for symptoms
    const newSymptoms: string[] = [];
    pregnancySymptoms.forEach(symptom => {
      if (lowerText.includes(symptom.toLowerCase())) {
        newSymptoms.push(symptom);
      }
    });
    
    if (newSymptoms.length > 0) {
      form.setValue("symptoms", newSymptoms);
    }
    
    // Check for previous complications
    if (lowerText.includes("previous complication") || lowerText.includes("complications before")) {
      form.setValue("previousComplications", true);
    }
    
    // Check for first pregnancy
    if (lowerText.includes("first pregnancy") || lowerText.includes("first time pregnant")) {
      form.setValue("isFirstPregnancy", true);
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
            <h2 className="text-lg font-semibold">{t("pregnancy_risk_assessment")}</h2>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={() => setShowPregnancyAssessment(false)}
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
                <p className="text-sm mb-3">{t("voice_input_details")}</p>
                <Button
                  type="button"
                  className="bg-primary/10 text-primary rounded-full py-2 px-4 w-full flex items-center justify-center"
                  onClick={startVoiceAssessment}
                >
                  <span className="material-icons mr-2">mic</span>
                  {t("start_voice_assessment")}
                </Button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("select_patient")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_or_add_patient")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPatients ? (
                              <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                            ) : pregnancyPatients?.length > 0 ? (
                              <>
                                {pregnancyPatients.map((patient: any) => (
                                  <SelectItem key={patient.id} value={patient.id.toString()}>
                                    {patient.name} ({patient.age} yrs)
                                  </SelectItem>
                                ))}
                              </>
                            ) : (
                              <SelectItem value="none" disabled>No eligible patients found</SelectItem>
                            )}
                            <SelectItem value="new">{t("add_new_patient")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pregnancyWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pregnancy_stage")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_trimester")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="8">First Trimester (1-12 weeks)</SelectItem>
                            <SelectItem value="20">Second Trimester (13-26 weeks)</SelectItem>
                            <SelectItem value="32">Third Trimester (27-40 weeks)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>{t("blood_pressure")}</FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="bloodPressureSystolic"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={t("systolic")} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bloodPressureDiastolic"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={t("diastolic")} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>{t("symptoms")}</FormLabel>
                        </div>
                        <div className="space-y-2">
                          {pregnancySymptoms.map((symptom) => (
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
                  
                  <FormField
                    control={form.control}
                    name="previousComplications"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>{t("previous_complications")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="yes" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("yes")}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="no" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("no")}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="first" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("first_pregnancy")}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
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
                        t("run_ai_assessment")
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

export default PregnancyAssessment;
