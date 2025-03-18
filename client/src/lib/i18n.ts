import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
const resources = {
  en: {
    translation: {
      // Header
      "app_name": "Svasthya Saathi",
      "offline": "Offline",
      "language": "EN",
      
      // Navigation
      "home": "Home",
      "assessments": "Assessments",
      "patients": "Patients",
      "resources": "Resources",
      
      // Dashboard
      "welcome": "Welcome,",
      "today_visits": "Today's Visits",
      "needs_attention": "Needs Attention",
      "quick_actions": "Quick Actions",
      
      // Action cards
      "pregnancy_assessment": "Pregnancy Assessment",
      "pregnancy_assessment_desc": "Identify high-risk cases",
      "child_health": "Child Health",
      "child_health_desc": "Anemia and nutrition check",
      "scheme_finder": "Scheme Finder",
      "scheme_finder_desc": "Find eligible healthcare schemes",
      "medical_guidelines": "Medical Guidelines",
      "medical_guidelines_desc": "Access best practices",
      
      // Patient section
      "high_risk_patients": "High-Risk Patients",
      "view_all": "View all",
      "high_risk": "High Risk",
      "medium_risk": "Medium Risk",
      "pregnant": "pregnant",
      "child": "Child",
      "call": "Call",
      
      // Assistant
      "ai_assistant": "AI Assistant",
      "ask_health_questions": "Ask any health-related questions",
      "type_speak_question": "Type or speak your question...",
      "listening": "Listening...",
      "translate": "Translate",
      "listen": "Listen",
      
      // Pregnancy assessment
      "pregnancy_risk_assessment": "Pregnancy Risk Assessment",
      "voice_input_details": "Fill details or use voice input for quick assessment",
      "start_voice_assessment": "Start Voice Assessment",
      "select_patient": "Select Patient",
      "select_or_add_patient": "Select or add new patient",
      "add_new_patient": "+ Add New Patient",
      "age": "Age",
      "pregnancy_stage": "Pregnancy Stage",
      "select_trimester": "Select trimester or weeks",
      "first_trimester": "First Trimester (1-12 weeks)",
      "second_trimester": "Second Trimester (13-26 weeks)",
      "third_trimester": "Third Trimester (27-40 weeks)",
      "blood_pressure": "Blood Pressure",
      "systolic": "Systolic (mmHg)",
      "diastolic": "Diastolic (mmHg)",
      "symptoms": "Symptoms (select all that apply)",
      "previous_complications": "Previous Pregnancy Complications?",
      "yes": "Yes",
      "no": "No",
      "first_pregnancy": "First pregnancy",
      "run_ai_assessment": "Run AI Assessment",
      
      // Scheme finder
      "healthcare_scheme_finder": "Healthcare Scheme Finder",
      "scheme_finder_info": "Find government healthcare schemes based on eligibility. AI will match the right schemes for your patients.",
      "state": "State",
      "select_state": "Select state",
      "age_group": "Age Group",
      "select_age_group": "Select age group",
      "gender": "Gender",
      "female": "Female",
      "male": "Male",
      "other": "Other",
      "annual_income": "Annual Household Income",
      "select_income": "Select income range",
      "health_concern": "Health Concern",
      "select_concern": "Select primary concern",
      "find_schemes": "Find Eligible Schemes",
      "use_voice_input": "Use Voice Input Instead",
      
      // Footer
      "sync_data": "Sync Data",
      "offline_data": "Offline Data",
      "support": "Support"
    }
  },
  hi: {
    translation: {
      // Header
      "app_name": "स्वास्थ्य साथी",
      "offline": "ऑफलाइन",
      "language": "HI",
      
      // Navigation
      "home": "होम",
      "assessments": "मूल्यांकन",
      "patients": "मरीज़",
      "resources": "संसाधन",
      
      // Dashboard
      "welcome": "स्वागत है,",
      "today_visits": "आज के विज़िट",
      "needs_attention": "ध्यान देने की ज़रूरत",
      "quick_actions": "त्वरित कार्रवाई",
      
      // Action cards
      "pregnancy_assessment": "गर्भावस्था मूल्यांकन",
      "pregnancy_assessment_desc": "उच्च जोखिम वाले मामलों की पहचान करें",
      "child_health": "बाल स्वास्थ्य",
      "child_health_desc": "एनीमिया और पोषण जांच",
      "scheme_finder": "योजना खोजक",
      "scheme_finder_desc": "पात्र स्वास्थ्य योजनाएं खोजें",
      "medical_guidelines": "चिकित्सा दिशानिर्देश",
      "medical_guidelines_desc": "सर्वोत्तम प्रथाओं तक पहुंच",
      
      // Patient section
      "high_risk_patients": "उच्च जोखिम वाले मरीज़",
      "view_all": "सभी देखें",
      "high_risk": "उच्च जोखिम",
      "medium_risk": "मध्यम जोखिम",
      "pregnant": "गर्भवती",
      "child": "बच्चा",
      "call": "कॉल करें",
      
      // Assistant
      "ai_assistant": "AI सहायक",
      "ask_health_questions": "कोई भी स्वास्थ्य संबंधित प्रश्न पूछें",
      "type_speak_question": "अपना प्रश्न टाइप करें या बोलें...",
      "listening": "सुन रहा है...",
      "translate": "अनुवाद करें",
      "listen": "सुनें",
      
      // Pregnancy assessment
      "pregnancy_risk_assessment": "गर्भावस्था जोखिम मूल्यांकन",
      "voice_input_details": "विवरण भरें या त्वरित मूल्यांकन के लिए आवाज इनपुट का उपयोग करें",
      "start_voice_assessment": "आवाज मूल्यांकन शुरू करें",
      "select_patient": "मरीज़ का चयन करें",
      "select_or_add_patient": "चयन करें या नया मरीज़ जोड़ें",
      "add_new_patient": "+ नया मरीज़ जोड़ें",
      "age": "उम्र",
      "pregnancy_stage": "गर्भावस्था का चरण",
      "select_trimester": "तिमाही या सप्ताह का चयन करें",
      "first_trimester": "पहली तिमाही (1-12 सप्ताह)",
      "second_trimester": "दूसरी तिमाही (13-26 सप्ताह)",
      "third_trimester": "तीसरी तिमाही (27-40 सप्ताह)",
      "blood_pressure": "रक्तचाप",
      "systolic": "सिस्टोलिक (mmHg)",
      "diastolic": "डायस्टोलिक (mmHg)",
      "symptoms": "लक्षण (सभी लागू का चयन करें)",
      "previous_complications": "पिछली गर्भावस्था में जटिलताएं?",
      "yes": "हां",
      "no": "नहीं",
      "first_pregnancy": "पहली गर्भावस्था",
      "run_ai_assessment": "AI मूल्यांकन चलाएं",
      
      // Scheme finder
      "healthcare_scheme_finder": "स्वास्थ्य योजना खोजक",
      "scheme_finder_info": "पात्रता के आधार पर सरकारी स्वास्थ्य योजनाएं खोजें। AI आपके मरीजों के लिए सही योजनाओं का मिलान करेगा।",
      "state": "राज्य",
      "select_state": "राज्य चुनें",
      "age_group": "आयु वर्ग",
      "select_age_group": "आयु वर्ग चुनें",
      "gender": "लिंग",
      "female": "महिला",
      "male": "पुरुष",
      "other": "अन्य",
      "annual_income": "वार्षिक पारिवारिक आय",
      "select_income": "आय सीमा चुनें",
      "health_concern": "स्वास्थ्य चिंता",
      "select_concern": "प्राथमिक चिंता चुनें",
      "find_schemes": "पात्र योजनाएं खोजें",
      "use_voice_input": "इसके बजाय आवाज इनपुट का उपयोग करें",
      
      // Footer
      "sync_data": "डेटा सिंक करें",
      "offline_data": "ऑफलाइन डेटा",
      "support": "सहायता"
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    fallbackLng: "en"
  });

export default i18n;
