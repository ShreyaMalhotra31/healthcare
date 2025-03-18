import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import session from "express-session";

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
    }
  }
}
import {
  insertUserSchema,
  insertPatientSchema,
  insertPregnancyAssessmentSchema,
  insertChildHealthAssessmentSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI with API key from environment
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "mock-key-please-set-env-var",
  });

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Error handling middleware
  const handleZodError = (err: ZodError) => {
    const errorMessages = err.errors.map(
      (error) => `${error.path.join(".")}: ${error.message}`
    );
    return { errors: errorMessages };
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Return user data without password
      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
  
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Return user data without password
      const { password: _, ...safeUserData } = user;
      res.status(201).json(safeUserData);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(handleZodError(err));
      }
      console.error("Create user error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Patient routes
  app.get("/api/patients", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const patients = await storage.getPatientsByUserId(userId);
      res.json(patients);
    } catch (err) {
      console.error("Get patients error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.userId !== req.session!.userId) {
        return res.status(403).json({ message: "Not authorized to view this patient" });
      }
      
      res.json(patient);
    } catch (err) {
      console.error("Get patient error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.post("/api/patients", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const patientData = insertPatientSchema.parse({
        ...req.body,
        userId,
      });
      
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(handleZodError(err));
      }
      console.error("Create patient error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.patch("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.userId !== req.session!.userId) {
        return res.status(403).json({ message: "Not authorized to update this patient" });
      }
      
      const updatedPatient = await storage.updatePatient(patientId, req.body);
      res.json(updatedPatient);
    } catch (err) {
      console.error("Update patient error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/high-risk-patients", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const patients = await storage.getHighRiskPatients(userId);
      res.json(patients);
    } catch (err) {
      console.error("Get high risk patients error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Pregnancy assessment routes
  app.post("/api/pregnancy-assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const assessmentData = insertPregnancyAssessmentSchema.parse({
        ...req.body,
        userId,
      });
      
      // Verify patient belongs to user
      const patient = await storage.getPatient(assessmentData.patientId);
      if (!patient || patient.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to assess this patient" });
      }
      
      // Determine risk level using AI
      let riskLevel = "normal";
      let recommendations = "";
      
      try {
        const prompt = `
          I am assessing a pregnant woman with the following details:
          - Pregnancy week: ${assessmentData.pregnancyWeek}
          - Blood pressure: ${assessmentData.bloodPressureSystolic}/${assessmentData.bloodPressureDiastolic} mmHg
          - Symptoms: ${JSON.stringify(assessmentData.symptoms)}
          - Previous complications: ${assessmentData.previousComplications ? "Yes" : "No"}
          - First pregnancy: ${assessmentData.isFirstPregnancy ? "Yes" : "No"}
          
          Based on this information, determine the risk level (high, medium, or normal) and provide recommendations.
          Response format: { "riskLevel": "high|medium|normal", "recommendations": "detailed recommendations here" }
        `;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });
        
        const responseText = completion.choices[0].message.content;
        if (responseText) {
          const aiResponse = JSON.parse(responseText);
          riskLevel = aiResponse.riskLevel;
          recommendations = aiResponse.recommendations;
        }
      } catch (error) {
        console.error("AI assessment error:", error);
        // Fallback to rule-based assessment if AI fails
        if (assessmentData.bloodPressureSystolic >= 140 || assessmentData.bloodPressureDiastolic >= 90) {
          riskLevel = "high";
          recommendations = "High blood pressure detected. Refer to doctor immediately.";
        } else if (assessmentData.symptoms.includes("Severe headache") || assessmentData.symptoms.includes("Vision problems")) {
          riskLevel = "high";
          recommendations = "Pre-eclampsia symptoms detected. Urgent medical attention required.";
        } else if (assessmentData.previousComplications) {
          riskLevel = "medium";
          recommendations = "Previous complications noted. Regular monitoring required.";
        }
      }
      
      const assessment = await storage.createPregnancyAssessment({
        ...assessmentData,
        riskLevel,
        recommendations,
      });
      
      res.status(201).json(assessment);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(handleZodError(err));
      }
      console.error("Create pregnancy assessment error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/patients/:id/pregnancy-assessments", requireAuth, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.userId !== req.session!.userId) {
        return res.status(403).json({ message: "Not authorized to view this patient's assessments" });
      }
      
      const assessments = await storage.getPregnancyAssessmentsByPatientId(patientId);
      res.json(assessments);
    } catch (err) {
      console.error("Get pregnancy assessments error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Child health assessment routes
  app.post("/api/child-health-assessments", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const assessmentData = insertChildHealthAssessmentSchema.parse({
        ...req.body,
        userId,
      });
      
      // Verify patient belongs to user
      const patient = await storage.getPatient(assessmentData.patientId);
      if (!patient || patient.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to assess this patient" });
      }
      
      // Determine risk level using AI
      let riskLevel = "normal";
      let recommendations = "";
      
      try {
        const prompt = `
          I am assessing a child with the following details:
          - Weight: ${assessmentData.weight} grams
          - Height: ${assessmentData.height} cm
          - Hemoglobin level: ${assessmentData.hemoglobinLevel} g/dL
          - Symptoms: ${JSON.stringify(assessmentData.symptoms)}
          
          Based on this information, determine the risk level (high, medium, or normal) and provide recommendations.
          Response format: { "riskLevel": "high|medium|normal", "recommendations": "detailed recommendations here", "nutritionalStatus": "underweight|normal|overweight" }
        `;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });
        
        const responseText = completion.choices[0].message.content;
        if (responseText) {
          const aiResponse = JSON.parse(responseText);
          riskLevel = aiResponse.riskLevel;
          recommendations = aiResponse.recommendations;
          assessmentData.nutritionalStatus = aiResponse.nutritionalStatus;
        }
      } catch (error) {
        console.error("AI assessment error:", error);
        // Fallback to rule-based assessment if AI fails
        if (assessmentData.hemoglobinLevel < 11) {
          riskLevel = assessmentData.hemoglobinLevel < 8 ? "high" : "medium";
          recommendations = "Anemia detected. Ensure iron-rich diet and supplements.";
          assessmentData.nutritionalStatus = "requires attention";
        }
      }
      
      const assessment = await storage.createChildHealthAssessment({
        ...assessmentData,
        riskLevel,
        recommendations,
      });
      
      res.status(201).json(assessment);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(handleZodError(err));
      }
      console.error("Create child health assessment error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/patients/:id/child-health-assessments", requireAuth, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      if (patient.userId !== req.session!.userId) {
        return res.status(403).json({ message: "Not authorized to view this patient's assessments" });
      }
      
      const assessments = await storage.getChildHealthAssessmentsByPatientId(patientId);
      res.json(assessments);
    } catch (err) {
      console.error("Get child health assessments error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Healthcare scheme routes
  app.get("/api/healthcare-schemes", async (req, res) => {
    try {
      const schemes = await storage.getHealthcareSchemes();
      res.json(schemes);
    } catch (err) {
      console.error("Get healthcare schemes error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/healthcare-schemes/:id", async (req, res) => {
    try {
      const schemeId = parseInt(req.params.id);
      const scheme = await storage.getSchemeById(schemeId);
      
      if (!scheme) {
        return res.status(404).json({ message: "Healthcare scheme not found" });
      }
      
      res.json(scheme);
    } catch (err) {
      console.error("Get healthcare scheme error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.post("/api/find-eligible-schemes", async (req, res) => {
    try {
      const { state, ageGroup, gender, income, healthConcern } = req.body;
      
      if (!state || !ageGroup || !gender || !income || !healthConcern) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const schemes = await storage.findEligibleSchemes(
        state,
        ageGroup,
        gender,
        parseInt(income),
        healthConcern
      );
      
      res.json(schemes);
    } catch (err) {
      console.error("Find eligible schemes error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Chat routes
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const { message, relatedPatientId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Save user message
      const userMessageData = insertChatMessageSchema.parse({
        userId,
        message,
        isUserMessage: true,
        relatedPatientId: relatedPatientId || null,
      });
      
      await storage.saveChatMessage(userMessageData);
      
      // Generate AI response
      let aiResponse = "I'm sorry, I couldn't process your request at the moment.";
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are an AI health assistant for ASHA workers and ANMs in rural India.
              Provide accurate, culturally appropriate healthcare guidance focusing on:
              1. Maternal and child health, especially anemia and high-risk pregnancies
              2. Local dietary recommendations using available foods
              3. Healthcare scheme eligibility and application processes
              4. Medical guidelines and best practices for rural healthcare workers
              Keep responses concise, practical, and accessible for frontline health workers.`
            },
            { role: "user", content: message }
          ],
        });
        
        aiResponse = completion.choices[0].message.content || aiResponse;
      } catch (error) {
        console.error("AI chat error:", error);
      }
      
      // Save AI response
      const aiMessageData = insertChatMessageSchema.parse({
        userId,
        message: aiResponse,
        isUserMessage: false,
        relatedPatientId: relatedPatientId || null,
      });
      
      const savedAiMessage = await storage.saveChatMessage(aiMessageData);
      
      res.json(savedAiMessage);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(handleZodError(err));
      }
      console.error("Chat error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  app.get("/api/chat-history", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const messages = await storage.getChatMessagesByUserId(userId);
      res.json(messages);
    } catch (err) {
      console.error("Get chat history error:", err);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
