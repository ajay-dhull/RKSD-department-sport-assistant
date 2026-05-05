/**
 * Pronunciation Corrections for Hindi Words in TTS
 * This file contains word replacements to fix pronunciation issues in Cartesia TTS
 * Optimized by AJ to read courses and common words naturally.
 */

export const pronunciationCorrections: Record<string, string> = {
  // Add custom word-by-word corrections here if needed
  // Example:
  // "NeuraXon": "Nyu Raak Son"
};

/**
 * Apply pronunciation corrections to text before sending to TTS
 * @param text - The original text
 * @returns text with pronunciation corrections applied
 */
export function applyPronunciationCorrections(text: string): string {
  let correctedText = text;

  /**
   * 🎓 Fix degree/course abbreviations
   */
  // Degree/course abbreviations - TTS-friendly phonetics
  correctedText = correctedText.replace(/\bB\.?A\b/gi, "Bee A");
  correctedText = correctedText.replace(/\bM\.?A\b/gi, "Em A");
  correctedText = correctedText.replace(/\bBCA\b/gi, "Bee See A");
  correctedText = correctedText.replace(/\bPGDCA\b/gi, "Pee Jee Dee See A");
  correctedText = correctedText.replace(/\bB\.?Sc\b/gi, "Bee Ess See");
  correctedText = correctedText.replace(/\bM\.?Sc\b/gi, "Em Ess See");
  correctedText = correctedText.replace(/\bPh\.?D\b/gi, "Pee Aych Dee");
  correctedText = correctedText.replace(/\bB\.?Com\b/gi, "Bee Kom");
  correctedText = correctedText.replace(/\bM\.?Com\b/gi, "Em Kom");

  /**
   * 👤 Title/Honorific abbreviations (Western)
   */
  correctedText = correctedText.replace(/\bMr\.?\s/gi, "Mister ");
  correctedText = correctedText.replace(/\bMrs\.?\s/gi, "Misses ");
  correctedText = correctedText.replace(/\bMs\.?\s/gi, "Miss ");
  correctedText = correctedText.replace(/\bDr\.?\s/gi, "Doctor ");
  correctedText = correctedText.replace(/\bProf\.?\s/gi, "Professor ");
  correctedText = correctedText.replace(/\bSr\.?\s/gi, "Senior ");
  correctedText = correctedText.replace(/\bJr\.?\s/gi, "Junior ");
  correctedText = correctedText.replace(/\bSt\.?\s/gi, "Saint ");
  
  /**
   * 🙏 Indian Honorific abbreviations
   */
  correctedText = correctedText.replace(/\bSh\.?\s/gi, "Shri ");
  correctedText = correctedText.replace(/\bShri\.?\s/gi, "Shri ");
  correctedText = correctedText.replace(/\bSmt\.?\s/gi, "Shrimati ");
  correctedText = correctedText.replace(/\bKm\.?\s/gi, "Kumari ");
  correctedText = correctedText.replace(/\bKu\.?\s/gi, "Kumari ");
  correctedText = correctedText.replace(/\bCh\.?\s/gi, "Chaudhary ");
  correctedText = correctedText.replace(/\bPt\.?\s/gi, "Pandit ");
  correctedText = correctedText.replace(/\bSwami\.?\s/gi, "Swami ");
  
  /**
   * 🔤 Single letter initials (expand for better pronunciation)
   * Matches patterns like "P." or "P " when followed by a capital letter or end of sentence
   */
  correctedText = correctedText.replace(/\b([A-Z])\.?\s+(?=[A-Z][a-z])/g, "$1. ");
  
  /**
   * 📛 Common name initials in Indian context
   * Patterns like "Sh. P." or "Dr. A." - expand the single letter
   */
  correctedText = correctedText.replace(/\b(Shri|Doctor|Professor|Mister|Misses|Miss)\s+([A-Z])\.?\s/gi, 
    (match, title, initial) => `${title} ${initial}. `);

  /**
   * 🔤 Technical abbreviation cleanup
   */
  correctedText = correctedText.replace(/AI\/ML/gi, "AI ML");
  correctedText = correctedText.replace(/\bA\.I\./gi, "AI");
  correctedText = correctedText.replace(/\bM\.L\./gi, "ML");
  
  /**
   * 🏫 Common college/academic abbreviations
   */
  correctedText = correctedText.replace(/\bHOD\b/gi, "Head of Department");
  correctedText = correctedText.replace(/\bH\.O\.D\./gi, "Head of Department");
  correctedText = correctedText.replace(/\bVice[\s-]?Principal\b/gi, "Vice Principal");
  correctedText = correctedText.replace(/\bV\.P\./gi, "Vice Principal");
  correctedText = correctedText.replace(/\bAsst\.?\s/gi, "Assistant ");
  correctedText = correctedText.replace(/\bAsstt\.?\s/gi, "Assistant ");
  correctedText = correctedText.replace(/\bAssociate\s+Prof\.?\s/gi, "Associate Professor ");
  correctedText = correctedText.replace(/\bAsso\.?\s+Prof\.?\s/gi, "Associate Professor ");
  correctedText = correctedText.replace(/\bDept\.?\s/gi, "Department ");
  correctedText = correctedText.replace(/\bUniv\.?\s/gi, "University ");
  correctedText = correctedText.replace(/\bColl\.?\s/gi, "College ");
  correctedText = correctedText.replace(/\bEst\.?\s/gi, "Established ");
  correctedText = correctedText.replace(/\bEstd\.?\s/gi, "Established ");
  
  /**
   * 📅 Date and time abbreviations
   */
  correctedText = correctedText.replace(/\bJan\.?\s/gi, "January ");
  correctedText = correctedText.replace(/\bFeb\.?\s/gi, "February ");
  correctedText = correctedText.replace(/\bMar\.?\s/gi, "March ");
  correctedText = correctedText.replace(/\bApr\.?\s/gi, "April ");
  correctedText = correctedText.replace(/\bJun\.?\s/gi, "June ");
  correctedText = correctedText.replace(/\bJul\.?\s/gi, "July ");
  correctedText = correctedText.replace(/\bAug\.?\s/gi, "August ");
  correctedText = correctedText.replace(/\bSep\.?\s/gi, "September ");
  correctedText = correctedText.replace(/\bSept\.?\s/gi, "September ");
  correctedText = correctedText.replace(/\bOct\.?\s/gi, "October ");
  correctedText = correctedText.replace(/\bNov\.?\s/gi, "November ");
  correctedText = correctedText.replace(/\bDec\.?\s/gi, "December ");
  
  /**
   * 📍 Location abbreviations
   */
  correctedText = correctedText.replace(/\bHry\.?\s/gi, "Haryana ");
  correctedText = correctedText.replace(/\bKKR\b/gi, "Kurukshetra");
  correctedText = correctedText.replace(/\bKaithal\b/gi, "Kaithal");

  /**
   * 📖 Apply dictionary-based pronunciation corrections
   */
  Object.entries(pronunciationCorrections).forEach(([original, corrected]) => {
    const regex = new RegExp(`\\b${original}\\b`, "gi");
    correctedText = correctedText.replace(regex, corrected);
  });

  return correctedText;
}

/**
 * Add a new pronunciation correction dynamically
 * @param original - The original word that needs correction
 * @param corrected - The corrected pronunciation
 */
export function addPronunciationCorrection(
  original: string,
  corrected: string
): void {
  pronunciationCorrections[original.toLowerCase()] = corrected;
}

/**
 * Get all current pronunciation corrections
 * @returns Object containing all corrections
 */
export function getPronunciationCorrections(): Record<string, string> {
  return { ...pronunciationCorrections };
}
