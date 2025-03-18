import {
  users,
  User,
  InsertUser,
  patients,
  Patient,
  InsertPatient,
  pregnancyAssessments,
  PregnancyAssessment,
  InsertPregnancyAssessment,
  childHealthAssessments,
  ChildHealthAssessment,
  InsertChildHealthAssessment,
  healthcareSchemes,
  HealthcareScheme,
  InsertHealthcareScheme,
  chatMessages,
  ChatMessage,
  InsertChatMessage,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientsByUserId(userId: number): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  getHighRiskPatients(userId: number): Promise<Patient[]>;
  
  // Pregnancy assessment methods
  createPregnancyAssessment(assessment: InsertPregnancyAssessment): Promise<PregnancyAssessment>;
  getPregnancyAssessmentsByPatientId(patientId: number): Promise<PregnancyAssessment[]>;
  getLatestPregnancyAssessment(patientId: number): Promise<PregnancyAssessment | undefined>;
  
  // Child health assessment methods
  createChildHealthAssessment(assessment: InsertChildHealthAssessment): Promise<ChildHealthAssessment>;
  getChildHealthAssessmentsByPatientId(patientId: number): Promise<ChildHealthAssessment[]>;
  getLatestChildHealthAssessment(patientId: number): Promise<ChildHealthAssessment | undefined>;
  
  // Healthcare scheme methods
  getHealthcareSchemes(): Promise<HealthcareScheme[]>;
  getSchemeById(id: number): Promise<HealthcareScheme | undefined>;
  findEligibleSchemes(state: string, ageGroup: string, gender: string, income: number, healthConcern: string): Promise<HealthcareScheme[]>;
  
  // Chat messages methods
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private pregnancyAssessments: Map<number, PregnancyAssessment>;
  private childHealthAssessments: Map<number, ChildHealthAssessment>;
  private healthcareSchemes: Map<number, HealthcareScheme>;
  private chatMessages: Map<number, ChatMessage>;
  
  private userIdCounter: number;
  private patientIdCounter: number;
  private pregnancyAssessmentIdCounter: number;
  private childHealthAssessmentIdCounter: number;
  private healthcareSchemeIdCounter: number;
  private chatMessageIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.pregnancyAssessments = new Map();
    this.childHealthAssessments = new Map();
    this.healthcareSchemes = new Map();
    this.chatMessages = new Map();
    
    this.userIdCounter = 1;
    this.patientIdCounter = 1;
    this.pregnancyAssessmentIdCounter = 1;
    this.childHealthAssessmentIdCounter = 1;
    this.healthcareSchemeIdCounter = 1;
    this.chatMessageIdCounter = 1;
    
    // Initialize with default data
    this.initializeData();
  }
  
  private initializeData() {
    // Add demo user
    const defaultUser: InsertUser = {
      username: "priya",
      password: "password123",
      fullName: "Priya Sharma",
      role: "ASHA Worker",
      location: "Ranchi, Jharkhand",
    };
    this.createUser(defaultUser);
    
    // Add sample healthcare schemes
    const schemes: InsertHealthcareScheme[] = [
      {
        name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        description: "Cash benefits for pregnant women and lactating mothers to improve health seeking behavior",
        eligibilityCriteria: ["pregnant_women", "first_child_only"],
        benefits: "₹5,000 in three installments for first live birth",
        applicationProcess: "Apply through Anganwadi worker with MCP card, Aadhaar card and bank account details",
        state: null, // National scheme
        targetGroup: "pregnant_women",
        incomeLimit: 0, // No income limit
      },
      {
        name: "Janani Suraksha Yojana (JSY)",
        description: "Cash assistance for institutional delivery to reduce maternal and infant mortality",
        eligibilityCriteria: ["pregnant_women", "institutional_delivery"],
        benefits: "₹1,400 in rural areas and ₹1,000 in urban areas for institutional delivery",
        applicationProcess: "Register at local health center with ID proof and bank account details",
        state: null, // National scheme
        targetGroup: "pregnant_women",
        incomeLimit: 0, // No income limit for LPS states
      },
      {
        name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        description: "Health insurance coverage for secondary and tertiary care hospitalization",
        eligibilityCriteria: ["bpl_families", "specified_occupational_categories"],
        benefits: "Health coverage up to ₹5 lakh per family per year",
        applicationProcess: "Verify eligibility on official website or through Common Service Centers, get e-card",
        state: null, // National scheme
        targetGroup: "general",
        incomeLimit: 250000, // Approximate for rural
      },
      {
        name: "Rashtriya Bal Swasthya Karyakram (RBSK)",
        description: "Child health screening and early intervention services",
        eligibilityCriteria: ["children_0_18"],
        benefits: "Free health screening, early detection and management of 4Ds - Defects, Diseases, Deficiencies, Development Delays",
        applicationProcess: "Available at public health facilities and through mobile health teams",
        state: null, // National scheme
        targetGroup: "children",
        incomeLimit: 0, // No income limit
      },
    ];
    
    schemes.forEach(scheme => {
      const id = this.healthcareSchemeIdCounter++;
      const newScheme: HealthcareScheme = { ...scheme, id };
      this.healthcareSchemes.set(id, newScheme);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }
  
  async getPatientsByUserId(userId: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(
      (patient) => patient.userId === userId,
    );
  }
  
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.patientIdCounter++;
    const newPatient: Patient = { 
      ...patient, 
      id, 
      lastVisitDate: new Date() 
    };
    this.patients.set(id, newPatient);
    return newPatient;
  }
  
  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) {
      return undefined;
    }
    
    const updatedPatient: Patient = {
      ...existingPatient,
      ...patient,
    };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }
  
  async getHighRiskPatients(userId: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(
      (patient) => patient.userId === userId && (patient.riskLevel === "high" || patient.riskLevel === "medium"),
    );
  }
  
  // Pregnancy assessment methods
  async createPregnancyAssessment(assessment: InsertPregnancyAssessment): Promise<PregnancyAssessment> {
    const id = this.pregnancyAssessmentIdCounter++;
    const newAssessment: PregnancyAssessment = { 
      ...assessment, 
      id, 
      assessmentDate: new Date() 
    };
    this.pregnancyAssessments.set(id, newAssessment);
    
    // Update patient risk level based on assessment
    const patient = await this.getPatient(assessment.patientId);
    if (patient) {
      await this.updatePatient(patient.id, { 
        riskLevel: assessment.riskLevel,
        healthConcern: "Pregnancy" 
      });
    }
    
    return newAssessment;
  }
  
  async getPregnancyAssessmentsByPatientId(patientId: number): Promise<PregnancyAssessment[]> {
    return Array.from(this.pregnancyAssessments.values()).filter(
      (assessment) => assessment.patientId === patientId,
    ).sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  }
  
  async getLatestPregnancyAssessment(patientId: number): Promise<PregnancyAssessment | undefined> {
    const assessments = await this.getPregnancyAssessmentsByPatientId(patientId);
    return assessments.length > 0 ? assessments[0] : undefined;
  }
  
  // Child health assessment methods
  async createChildHealthAssessment(assessment: InsertChildHealthAssessment): Promise<ChildHealthAssessment> {
    const id = this.childHealthAssessmentIdCounter++;
    const newAssessment: ChildHealthAssessment = { 
      ...assessment, 
      id, 
      assessmentDate: new Date() 
    };
    this.childHealthAssessments.set(id, newAssessment);
    
    // Update patient risk level based on assessment
    const patient = await this.getPatient(assessment.patientId);
    if (patient) {
      await this.updatePatient(patient.id, { 
        riskLevel: assessment.riskLevel,
        healthConcern: "Child Health" 
      });
    }
    
    return newAssessment;
  }
  
  async getChildHealthAssessmentsByPatientId(patientId: number): Promise<ChildHealthAssessment[]> {
    return Array.from(this.childHealthAssessments.values()).filter(
      (assessment) => assessment.patientId === patientId,
    ).sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime());
  }
  
  async getLatestChildHealthAssessment(patientId: number): Promise<ChildHealthAssessment | undefined> {
    const assessments = await this.getChildHealthAssessmentsByPatientId(patientId);
    return assessments.length > 0 ? assessments[0] : undefined;
  }
  
  // Healthcare scheme methods
  async getHealthcareSchemes(): Promise<HealthcareScheme[]> {
    return Array.from(this.healthcareSchemes.values());
  }
  
  async getSchemeById(id: number): Promise<HealthcareScheme | undefined> {
    return this.healthcareSchemes.get(id);
  }
  
  async findEligibleSchemes(
    state: string, 
    ageGroup: string, 
    gender: string, 
    income: number, 
    healthConcern: string
  ): Promise<HealthcareScheme[]> {
    const allSchemes = await this.getHealthcareSchemes();
    
    // Map age group to target groups
    let targetGroups: string[] = [];
    if (ageGroup === "Child (0-12 years)") {
      targetGroups.push("children");
    } else if (ageGroup === "Adolescent (13-18 years)") {
      targetGroups.push("children", "adolescents");
    } else if (ageGroup === "Adult (19-60 years)") {
      if (gender === "Female" && healthConcern === "Pregnancy & Maternal Health") {
        targetGroups.push("pregnant_women");
      }
      targetGroups.push("general", "adults");
    } else if (ageGroup === "Senior Citizen (60+ years)") {
      targetGroups.push("elderly", "general");
    }
    
    // Filter schemes based on criteria
    return allSchemes.filter(scheme => {
      // Check state-specific or national
      if (scheme.state && scheme.state !== state && scheme.state !== "All States") {
        return false;
      }
      
      // Check income limit
      if (scheme.incomeLimit > 0 && income > scheme.incomeLimit) {
        return false;
      }
      
      // Check target group
      const isTargetGroupMatch = !scheme.targetGroup || 
        targetGroups.includes(scheme.targetGroup) || 
        scheme.targetGroup === "general";
      
      return isTargetGroupMatch;
    });
  }
  
  // Chat messages methods
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const newMessage: ChatMessage = { 
      ...message, 
      id, 
      timestamp: new Date() 
    };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
