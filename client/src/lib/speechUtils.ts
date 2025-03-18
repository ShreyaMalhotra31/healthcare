// Speech recognition and synthesis utilities

// Check if browser supports speech recognition
const speechRecognitionSupported =
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

// Check if browser supports speech synthesis
const speechSynthesisSupported = 'speechSynthesis' in window;

// Map of supported languages
export const supportedLanguages = {
  'en-IN': 'English (India)',
  'hi-IN': 'Hindi',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
};

// Speech recognition instance
let recognition: any = null;

// Initialize speech recognition
function initSpeechRecognition(language: string = 'en-IN') {
  if (!speechRecognitionSupported) {
    throw new Error('Speech recognition is not supported in this browser.');
  }
  
  // @ts-ignore - TypeScript doesn't know about webkit prefixed API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  
  return recognition;
}

// Start speech recognition
export function startSpeechRecognition(
  language: string = 'en-IN',
  onResult: (text: string) => void,
  onError: (error: any) => void
) {
  if (!recognition) {
    recognition = initSpeechRecognition(language);
  } else {
    recognition.lang = language;
  }
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  
  recognition.onerror = (event: any) => {
    onError(event.error);
  };
  
  recognition.start();
}

// Stop speech recognition
export function stopSpeechRecognition() {
  if (recognition) {
    recognition.stop();
  }
}

// Speak text using speech synthesis
export function speakText(
  text: string,
  language: string = 'en-IN',
  onEnd?: () => void
) {
  if (!speechSynthesisSupported) {
    throw new Error('Speech synthesis is not supported in this browser.');
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  utterance.lang = language;
  
  // Set callback
  if (onEnd) {
    utterance.onend = onEnd;
  }
  
  // Find a voice that matches the language
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
  
  if (voice) {
    utterance.voice = voice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// Stop speech synthesis
export function stopSpeaking() {
  if (speechSynthesisSupported) {
    window.speechSynthesis.cancel();
  }
}

// Check if speech recognition is supported
export function isSpeechRecognitionSupported() {
  return speechRecognitionSupported;
}

// Check if speech synthesis is supported
export function isSpeechSynthesisSupported() {
  return speechSynthesisSupported;
}
