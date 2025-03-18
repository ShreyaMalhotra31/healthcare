import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { ModalContext, ConnectionContext } from "@/App";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { getSchemeRecommendations } from "@/lib/openai";
import { 
  startSpeechRecognition, 
  stopSpeechRecognition, 
  isSpeechRecognitionSupported 
} from "@/lib/speechUtils";
import { addPendingSync } from "@/lib/indexedDB";
import { X } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Form schema
const schemeFinderSchema = z.object({
  state: z.string().min(1, "Please select a state"),
  ageGroup: z.string().min(1, "Please select an age group"),
  gender: z.string().min(1, "Please select a gender"),
  income: z.string().min(1, "Please select an income range"),
  healthConcern: z.string().min(1, "Please select a health concern"),
});

type SchemeFinderFormValues = z.infer<typeof schemeFinderSchema>;

// States list
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

// Income ranges
const incomeRanges = [
  { label: "Below ₹60,000", value: "60000" },
  { label: "₹60,000 - ₹1,00,000", value: "100000" },
  { label: "₹1,00,000 - ₹2,50,000", value: "250000" },
  { label: "₹2,50,000 - ₹5,00,000", value: "500000" },
  { label: "Above ₹5,00,000", value: "500001" },
];

// Health concerns
const healthConcerns = [
  "Pregnancy & Maternal Health",
  "Child Health & Nutrition",
  "General Healthcare",
  "Chronic Disease",
  "Surgery & Hospital Care",
  "Disability Support",
  "Other",
];

const SchemeFinder = () => {
  const { setShowSchemeFinder } = useContext(ModalContext);
  const { isOnline } = useContext(ConnectionContext);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Initialize form
  const form = useForm<SchemeFinderFormValues>({
    resolver: zodResolver(schemeFinderSchema),
    defaultValues: {
      state: "",
      ageGroup: "",
      gender: "",
      income: "",
      healthConcern: "",
    },
  });

  // Find schemes mutation
  const findSchemesMutation = useMutation({
    mutationFn: async (data: SchemeFinderFormValues) => {
      if (!isOnline) {
        // Store for syncing later
        await addPendingSync("/api/find-eligible-schemes", "POST", data);
        return [];
      }
      
      return getSchemeRecommendations(
        data.state,
        data.ageGroup,
        data.gender,
        parseInt(data.income),
        data.healthConcern
      );
    },
    onSuccess: (data) => {
      setEligibleSchemes(data);
      setShowResults(true);
      
      if (data.length === 0) {
        toast({
          title: "No schemes found",
          description: "No eligible healthcare schemes found for the given criteria",
        });
      } else {
        toast({
          title: "Schemes found",
          description: `Found ${data.length} eligible healthcare schemes`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to find eligible schemes. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: SchemeFinderFormValues) => {
    findSchemesMutation.mutate(data);
  };
  
  // Start voice input
  const startVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    setIsVoiceMode(true);
    
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
        setIsVoiceMode(false);
      }
    );
  };
  
  // Process voice input (simplified - a real implementation would use NLP)
  const processVoiceInput = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Try to extract state
    for (const state of indianStates) {
      if (lowerText.includes(state.toLowerCase())) {
        form.setValue("state", state);
        break;
      }
    }
    
    // Try to extract age group
    if (lowerText.includes("child") || lowerText.includes("baby") || lowerText.match(/\b\d+\s*year\s*old\s*child\b/)) {
      form.setValue("ageGroup", "Child (0-12 years)");
    } else if (lowerText.includes("teen") || lowerText.includes("adolescent")) {
      form.setValue("ageGroup", "Adolescent (13-18 years)");
    } else if (lowerText.includes("senior") || lowerText.includes("elderly") || lowerText.includes("old age")) {
      form.setValue("ageGroup", "Senior Citizen (60+ years)");
    } else {
      form.setValue("ageGroup", "Adult (19-60 years)");
    }
    
    // Try to extract gender
    if (lowerText.includes("female") || lowerText.includes("woman") || lowerText.includes("mother") || lowerText.includes("girl")) {
      form.setValue("gender", "Female");
    } else if (lowerText.includes("male") || lowerText.includes("man") || lowerText.includes("father") || lowerText.includes("boy")) {
      form.setValue("gender", "Male");
    }
    
    // Try to extract income (very simplified)
    if (lowerText.includes("poor") || lowerText.includes("low income") || lowerText.includes("bpl")) {
      form.setValue("income", "60000");
    } else if (lowerText.includes("middle class") || lowerText.includes("moderate income")) {
      form.setValue("income", "250000");
    } else if (lowerText.includes("rich") || lowerText.includes("high income")) {
      form.setValue("income", "500001");
    }
    
    // Try to extract health concern
    if (lowerText.includes("pregnan") || lowerText.includes("maternal") || lowerText.includes("birth")) {
      form.setValue("healthConcern", "Pregnancy & Maternal Health");
    } else if (lowerText.includes("child") || lowerText.includes("nutrition") || lowerText.includes("growth")) {
      form.setValue("healthConcern", "Child Health & Nutrition");
    } else if (lowerText.includes("diabet") || lowerText.includes("heart") || lowerText.includes("chronic")) {
      form.setValue("healthConcern", "Chronic Disease");
    } else if (lowerText.includes("surgery") || lowerText.includes("operation") || lowerText.includes("hospital")) {
      form.setValue("healthConcern", "Surgery & Hospital Care");
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
  
  // Reset form and go back to criteria
  const goBackToCriteria = () => {
    setShowResults(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("healthcare_scheme_finder")}</h2>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={() => setShowSchemeFinder(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          {isVoiceMode ? (
            // Voice input mode
            <div>
              <div className="mb-6 text-center">
                <p className="text-sm mb-4">Describe the person's situation including state, age, gender, income level, and health concern</p>
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
          ) : showResults ? (
            // Results view
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Eligible Schemes</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goBackToCriteria}
                >
                  <span className="material-icons text-sm mr-1">arrow_back</span>
                  Back
                </Button>
              </div>
              
              {eligibleSchemes.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {eligibleSchemes.map((scheme: any) => (
                    <AccordionItem 
                      key={scheme.id} 
                      value={`scheme-${scheme.id}`} 
                      className="border rounded-lg p-1 mb-4"
                    >
                      <Card>
                        <CardHeader className="p-4 pb-0">
                          <AccordionTrigger className="pt-0 hover:no-underline">
                            <div className="text-left">
                              <CardTitle className="text-lg">{scheme.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {scheme.state ? `${scheme.state} scheme` : "National scheme"}
                              </CardDescription>
                            </div>
                          </AccordionTrigger>
                        </CardHeader>
                        <AccordionContent>
                          <CardContent className="p-4 pt-2">
                            <div className="space-y-3">
                              <p className="text-sm text-neutral-800">{scheme.description}</p>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">Benefits:</h4>
                                <p className="text-sm">{scheme.benefits}</p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">Eligibility:</h4>
                                <ul className="list-disc pl-5 text-sm">
                                  {scheme.eligibilityCriteria.map((criteria: string, index: number) => (
                                    <li key={index}>{criteria.replace(/_/g, " ")}</li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">How to Apply:</h4>
                                <p className="text-sm">{scheme.applicationProcess}</p>
                              </div>
                              
                              {scheme.incomeLimit > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Income Limit:</h4>
                                  <p className="text-sm">₹{scheme.incomeLimit.toLocaleString()} per annum</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button className="w-full bg-primary text-white">
                              Help Patient Apply
                            </Button>
                          </CardFooter>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-4xl text-neutral-400 mb-2">
                    sentiment_dissatisfied
                  </span>
                  <h3 className="text-lg font-medium mb-2">No eligible schemes found</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Try adjusting your criteria or check back later
                  </p>
                  <Button
                    onClick={goBackToCriteria}
                    className="bg-primary text-white"
                  >
                    Modify Criteria
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Form view
            <>
              <div className="bg-primary/10 rounded-lg p-4 mb-5">
                <div className="flex items-start">
                  <span className="material-icons text-primary mr-3">info</span>
                  <p className="text-sm">{t("scheme_finder_info")}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("state")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_state")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {indianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ageGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("age_group")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_age_group")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Child (0-12 years)">Child (0-12 years)</SelectItem>
                            <SelectItem value="Adolescent (13-18 years)">Adolescent (13-18 years)</SelectItem>
                            <SelectItem value="Adult (19-60 years)">Adult (19-60 years)</SelectItem>
                            <SelectItem value="Senior Citizen (60+ years)">Senior Citizen (60+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>{t("gender")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Female" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("female")}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Male" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("male")}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Other" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("other")}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("annual_income")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_income")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incomeRanges.map((range) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="healthConcern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("health_concern")}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_concern")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {healthConcerns.map((concern) => (
                              <SelectItem key={concern} value={concern}>
                                {concern}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6">
                    <Button
                      type="submit"
                      className="w-full bg-primary text-white py-3 rounded-lg font-medium"
                      disabled={findSchemesMutation.isPending}
                    >
                      {findSchemesMutation.isPending ? (
                        <span className="flex items-center">
                          <span className="material-icons animate-spin mr-2">autorenew</span>
                          Searching...
                        </span>
                      ) : (
                        t("find_schemes")
                      )}
                    </Button>
                    <Button
                      type="button"
                      className="w-full border border-primary text-primary py-2.5 rounded-lg font-medium mt-3 flex items-center justify-center"
                      onClick={startVoiceInput}
                    >
                      <span className="material-icons mr-2">mic</span>
                      {t("use_voice_input")}
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

export default SchemeFinder;
