import { apiRequest } from './queryClient';

interface ChatCompletionMessage {
  content: string;
  role: 'user' | 'assistant' | 'system';
}

interface ChatCompletionRequest {
  messages: ChatCompletionMessage[];
  language?: string;
}

interface ChatCompletionResponse {
  message: string;
}

/**
 * Process chat message using the server's OpenAI integration
 * This is a client-side wrapper that calls our backend endpoint
 */
export async function processChatMessage(
  prompt: string,
  relatedPatientId?: number
): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/chat", {
      message: prompt,
      relatedPatientId
    });
    
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error processing chat message:", error);
    throw new Error("Failed to get AI response. Please try again.");
  }
}

/**
 * Get healthcare scheme recommendations based on user inputs
 */
export async function getSchemeRecommendations(
  state: string,
  ageGroup: string,
  gender: string,
  income: number,
  healthConcern: string
) {
  try {
    const response = await apiRequest("POST", "/api/find-eligible-schemes", {
      state,
      ageGroup,
      gender,
      income,
      healthConcern
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error getting scheme recommendations:", error);
    throw new Error("Failed to get scheme recommendations. Please try again.");
  }
}

/**
 * Process pregnancy assessment to get risk evaluation
 */
export async function processPregnancyAssessment(assessmentData: any) {
  try {
    const response = await apiRequest("POST", "/api/pregnancy-assessments", assessmentData);
    return await response.json();
  } catch (error) {
    console.error("Error processing pregnancy assessment:", error);
    throw new Error("Failed to process assessment. Please try again.");
  }
}

/**
 * Process child health assessment to get risk evaluation
 */
export async function processChildHealthAssessment(assessmentData: any) {
  try {
    const response = await apiRequest("POST", "/api/child-health-assessments", assessmentData);
    return await response.json();
  } catch (error) {
    console.error("Error processing child health assessment:", error);
    throw new Error("Failed to process assessment. Please try again.");
  }
}
