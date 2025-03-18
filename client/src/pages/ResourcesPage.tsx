import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, Search } from "lucide-react";

const ResourcesPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("guidelines");
  
  // Get healthcare schemes
  const { data: schemes, isLoading: isLoadingSchemes } = useQuery({
    queryKey: ["/api/healthcare-schemes"],
    enabled: activeTab === "schemes",
  });

  // Medical guidelines (would typically come from an API)
  const guidelines = [
    {
      id: 1,
      title: "Antenatal Care Protocol",
      category: "Pregnancy",
      summary: "Guidelines for routine antenatal checkups and monitoring",
      downloadUrl: "#antenatal-care",
      lastUpdated: "2023-06-15",
    },
    {
      id: 2,
      title: "Anemia Detection and Management",
      category: "Nutrition",
      summary: "Protocol for screening and managing anemia in pregnant women and children",
      downloadUrl: "#anemia-management",
      lastUpdated: "2023-05-22",
    },
    {
      id: 3,
      title: "High-Risk Pregnancy Identification",
      category: "Pregnancy",
      summary: "Warning signs and management of complications during pregnancy",
      downloadUrl: "#high-risk-pregnancy",
      lastUpdated: "2023-04-10",
    },
    {
      id: 4,
      title: "Child Growth Monitoring",
      category: "Child Health",
      summary: "Standards for tracking child growth and addressing malnutrition",
      downloadUrl: "#child-growth",
      lastUpdated: "2023-07-01",
    },
    {
      id: 5,
      title: "Immunization Schedule",
      category: "Child Health",
      summary: "National immunization schedule for children under 5 years",
      downloadUrl: "#immunization",
      lastUpdated: "2023-03-15",
    },
  ];
  
  // Filter resources based on search term
  const filteredGuidelines = guidelines.filter(
    (guideline) =>
      guideline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guideline.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guideline.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSchemes = schemes?.filter(
    (scheme: any) =>
      scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.targetGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resources</h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4" />
        <Input
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Resource tabs */}
      <Tabs defaultValue="guidelines" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guidelines">Medical Guidelines</TabsTrigger>
          <TabsTrigger value="schemes">Healthcare Schemes</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        </TabsList>
        
        {/* Guidelines tab */}
        <TabsContent value="guidelines">
          <div className="space-y-4">
            {filteredGuidelines.length > 0 ? (
              filteredGuidelines.map((guideline) => (
                <GuidelineCard key={guideline.id} guideline={guideline} />
              ))
            ) : (
              <div className="text-center py-10">
                <span className="material-icons text-4xl text-neutral-400 mb-2">
                  search_off
                </span>
                <h3 className="text-lg font-medium mb-2">No guidelines found</h3>
                <p className="text-sm text-neutral-600">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Schemes tab */}
        <TabsContent value="schemes">
          {isLoadingSchemes ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSchemes?.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredSchemes.map((scheme: any) => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10">
              <span className="material-icons text-4xl text-neutral-400 mb-2">
                search_off
              </span>
              <h3 className="text-lg font-medium mb-2">No schemes found</h3>
              <p className="text-sm text-neutral-600">
                Try adjusting your search terms
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Nutrition tab */}
        <TabsContent value="nutrition">
          <div className="space-y-6">
            <NutritionSection
              title="Nutrition During Pregnancy"
              description="Essential nutrients for pregnant women"
              items={[
                {
                  name: "Iron-rich Foods",
                  examples: "Spinach, lentils, beans, jaggery (gud), iron-fortified flour",
                  benefits: "Prevents anemia, supports fetal development",
                },
                {
                  name: "Calcium-rich Foods",
                  examples: "Milk, curd, ragi, sesame seeds, small fish with bones",
                  benefits: "Supports bone development in the fetus",
                },
                {
                  name: "Protein Sources",
                  examples: "Pulses, milk, eggs, nuts and seeds",
                  benefits: "Essential for fetal growth and maternal tissue",
                },
                {
                  name: "Folate-rich Foods",
                  examples: "Green leafy vegetables, citrus fruits, legumes",
                  benefits: "Prevents neural tube defects, supports cell division",
                },
              ]}
            />
            
            <NutritionSection
              title="Child Nutrition (0-5 years)"
              description="Essential nutrients for child growth and development"
              items={[
                {
                  name: "First 6 months",
                  examples: "Exclusive breastfeeding",
                  benefits: "Complete nutrition, immunity support",
                },
                {
                  name: "6-12 months",
                  examples: "Breast milk + soft foods (mashed dal-rice, khichdi, mashed fruits)",
                  benefits: "Complementary nutrition, introducing variety",
                },
                {
                  name: "1-3 years",
                  examples: "Family foods, milk, eggs, fruits, vegetables, grains",
                  benefits: "Supports rapid growth and brain development",
                },
                {
                  name: "3-5 years",
                  examples: "Balanced diet with all food groups; limited processed foods",
                  benefits: "Energy for activity, cognitive development",
                },
              ]}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Local Food Alternatives</CardTitle>
                <CardDescription>
                  Affordable, locally available nutritious foods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Iron-rich alternatives:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Amaranth leaves (chaulai/chauli) instead of spinach</li>
                      <li>Jaggery (gud) instead of sugar</li>
                      <li>Garden cress seeds (halim) for iron supplementation</li>
                      <li>Curry leaves added to dishes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Protein alternatives:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Mixed pulses (dals) when meat is unavailable</li>
                      <li>Sattu (roasted gram flour) as protein supplement</li>
                      <li>Small dried fish for complete protein</li>
                      <li>Sprouted grains and legumes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Calcium alternatives:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Ragi (finger millet) for non-dairy calcium</li>
                      <li>Green leafy vegetables</li>
                      <li>Sesame seeds (til) added to dishes</li>
                      <li>Small fish consumed with bones</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Nutrition Chart
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface GuidelineCardProps {
  guideline: {
    id: number;
    title: string;
    category: string;
    summary: string;
    downloadUrl: string;
    lastUpdated: string;
  };
}

const GuidelineCard = ({ guideline }: GuidelineCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{guideline.title}</CardTitle>
          <Badge variant="outline">{guideline.category}</Badge>
        </div>
        <CardDescription>
          Last updated: {new Date(guideline.lastUpdated).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-800">{guideline.summary}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <span className="material-icons text-sm mr-1">visibility</span>
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/10"
        >
          <span className="material-icons text-sm mr-1">download</span>
          Download for Offline
        </Button>
      </CardFooter>
    </Card>
  );
};

interface SchemeCardProps {
  scheme: any;
}

const SchemeCard = ({ scheme }: SchemeCardProps) => {
  return (
    <AccordionItem value={`scheme-${scheme.id}`} className="border rounded-lg p-1 mb-4">
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
  );
};

interface NutritionSectionProps {
  title: string;
  description: string;
  items: {
    name: string;
    examples: string;
    benefits: string;
  }[];
}

const NutritionSection = ({ title, description, items }: NutritionSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
              <h4 className="font-medium mb-2">{item.name}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Examples</Label>
                  <p className="text-sm">{item.examples}</p>
                </div>
                <div>
                  <Label className="text-xs">Benefits</Label>
                  <p className="text-sm">{item.benefits}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourcesPage;
