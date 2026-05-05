/**
 * Advanced Text Normalization for ElevenLabs TTS
 * Handles numbers, years, times, acronyms, ordinals for better pronunciation
 */

// Custom pronunciation mapping
const customPronunciations: Record<string, string> = {
  'RKSD': 'R K S D',
  'Kurukshetra': 'Kurukshetra',
  'Kaithal': 'Kaithal',
  'B.Tech': 'B Tech',
  'B.Com': 'B Com',
  'B.Sc': 'B Sc',
  'M.Tech': 'M Tech',
  'Ph.D': 'P H D',
  'MBA': 'M B A',
  'BCA': 'B C A',
  'MCA': 'M C A'
};

// Number to words conversion
function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
               'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
               'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num === 0) return 'zero';
  if (num < 0) return 'minus ' + numberToWords(-num);
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
  if (num < 10000) return ones[Math.floor(num / 1000)] + ' thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  
  // For very large numbers, read digit by digit
  return num.toString().split('').map(d => ones[parseInt(d)] || 'zero').join(' ');
}

// Convert a number to digit-by-digit reading (for case/file numbers)
function digitsToWords(numStr: string): string {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  return numStr.split('').map(d => ones[parseInt(d)] ?? d).join(' ');
}

/**
 * Convert years to proper pronunciation (extend existing logic)
 */
export function normalizeYears(text: string): string {
  return text.replace(/\b(19|20)\d{2}\b/g, (match) => {
    const year = parseInt(match);
    if (year >= 1900 && year <= 1999) {
      const lastTwo = year - 1900;
      if (lastTwo === 0) return 'nineteen hundred';
      if (lastTwo < 10) return `nineteen oh ${numberToWords(lastTwo)}`;
      return `nineteen ${numberToWords(lastTwo)}`;
    } else if (year >= 2000 && year <= 2099) {
      const lastTwo = year - 2000;
      if (lastTwo === 0) return 'two thousand';
      if (lastTwo < 10) return `two thousand ${numberToWords(lastTwo)}`;
      return `two thousand ${numberToWords(lastTwo)}`;
    }
    return match;
  });
}

/**
 * Convert times and AM/PM to proper pronunciation
 * 8:00 AM → "eight am", 5:45 PM → "five forty five pm"
 */
export function normalizeTimes(text: string): string {
  // Convert times with minutes: 5:45 PM → "five forty five pm"
  text = text.replace(/\b(\d{1,2}):(\d{2})\s*([APap][Mm])\b/g, (match, hour, minutes, ampm) => {
    const h = parseInt(hour, 10);
    const m = parseInt(minutes, 10);
    const hourWord = numberToWords(h);
    const period = ampm.toLowerCase().replace(/\./g, '');
    
    // If minutes are 00, just say hour + am/pm
    if (m === 0) {
      return `${hourWord} ${period}`;
    }
    
    // Otherwise say hour + minutes + am/pm
    const minuteWord = numberToWords(m);
    return `${hourWord} ${minuteWord} ${period}`;
  });

  // Convert simple times without colon: 8 AM → "eight am"  
  text = text.replace(/\b(\d{1,2})\s*([APap][Mm])\b/g, (match, hour, ampm) => {
    const h = parseInt(hour, 10);
    const hourWord = numberToWords(h);
    const period = ampm.toLowerCase().replace(/\./g, '');
    
    return `${hourWord} ${period}`;
  });

  // Convert time ranges like "8:00 AM se 5:00 PM" or "8 AM to 5 PM"
  text = text.replace(/\b(\d{1,2}):?(\d{2})?\s*([APap][Mm])\s*(se|to|-)\s*(\d{1,2}):?(\d{2})?\s*([APap][Mm])\b/g, 
    (match, h1, m1, ap1, connector, h2, m2, ap2) => {
      const hour1Word = numberToWords(parseInt(h1));
      const hour2Word = numberToWords(parseInt(h2));
      const period1 = ap1.toLowerCase().replace(/\./g, '');
      const period2 = ap2.toLowerCase().replace(/\./g, '');
      
      // Handle first time
      let time1;
      if (m1 && parseInt(m1) !== 0) {
        const minute1Word = numberToWords(parseInt(m1));
        time1 = `${hour1Word} ${minute1Word} ${period1}`;
      } else {
        time1 = `${hour1Word} ${period1}`;
      }
      
      // Handle second time
      let time2;
      if (m2 && parseInt(m2) !== 0) {
        const minute2Word = numberToWords(parseInt(m2));
        time2 = `${hour2Word} ${minute2Word} ${period2}`;
      } else {
        time2 = `${hour2Word} ${period2}`;
      }
      
      const connectorWord = connector === 'se' ? 'se' : 'to';
      return `${time1} ${connectorWord} ${time2}`;
    });

  return text;
}

/**
 * Convert ordinals (1st, 2nd, 3rd, etc.) to words
 */
export function normalizeOrdinals(text: string): string {
  const ordinalMap: Record<string, string> = {
    '1': 'first', '2': 'second', '3': 'third', '4': 'fourth', '5': 'fifth',
    '6': 'sixth', '7': 'seventh', '8': 'eighth', '9': 'ninth', '10': 'tenth',
    '11': 'eleventh', '12': 'twelfth', '13': 'thirteenth', '14': 'fourteenth', '15': 'fifteenth',
    '16': 'sixteenth', '17': 'seventeenth', '18': 'eighteenth', '19': 'nineteenth', '20': 'twentieth',
    '21': 'twenty first', '22': 'twenty second', '23': 'twenty third', '30': 'thirtieth'
  };

  return text.replace(/\b(\d+)(st|nd|rd|th)\b/g, (match, num) => {
    if (ordinalMap[num]) return ordinalMap[num];
    
    // Fallback for larger numbers
    const numWord = numberToWords(parseInt(num, 10));
    if (numWord !== num) return numWord + 'th';
    
    return match; // Keep original if conversion failed
  });
}

/**
 * Handle acronyms (convert ALL-CAPS to spaced letters)
 */
export function normalizeAcronyms(text: string): string {
  return text.replace(/\b([A-Z]{2,6})\b/g, (match) => {
    // Skip common English words that are legitimately all caps
    const exceptions = ['USA', 'UK', 'AI', 'IT', 'TV', 'OK', 'AM', 'PM'];
    if (exceptions.includes(match)) return match;
    
    // Convert to spaced letters for pronunciation
    if (match.length <= 6) return match.split('').join(' ');
    return match;
  });
}

/**
 * Normalize URLs for better pronunciation
 * Converts https://rksdcollege.ac.in to "R K S D college dot a c dot i n"
 */
export function normalizeURLs(text: string): string {
  // Match URLs starting with http:// or https://
  return text.replace(/https?:\/\/([a-zA-Z0-9.-]+)/g, (match, domain) => {
    // Remove protocol and just work with domain
    let result = '';
    
    // Split domain by dots
    const parts = domain.split('.');
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Handle special cases like "rksdcollege" 
      if (part.toLowerCase().includes('rksd')) {
        result += 'R K S D ';
        // Get the remaining part after 'rksd'
        const remaining = part.toLowerCase().replace('rksd', '');
        if (remaining) {
          result += remaining + ' ';
        }
      } 
      // Handle other parts
      else if (part.length <= 3) {
        // Short parts like "ac", "in" - spell out each letter
        result += part.split('').join(' ');
      } else {
        // Longer parts - say as word
        result += part;
      }
      
      // Add "dot" between parts (except for the last one)
      if (i < parts.length - 1) {
        result += ' dot ';
      }
    }
    
    return result.trim();
  });
}

/**
 * Normalize phone numbers for better pronunciation
 * Converts +91-1746234 or +91-1746-220103 to "plus nine one, one seven four six two three four" or "plus nine one, one seven four six, two two zero one zero three"
 */
export function normalizePhoneNumbers(text: string): string {
  // Match various phone number patterns:
  // Pattern 1: +[country code]-[full number] (e.g., +91-1746234)
  // Pattern 2: +[country code]-[area code]-[number] (e.g., +91-1746-220103)
  // Pattern 3: Plain 10 digit numbers (e.g., 9876543210)
  
  // First handle international format with +
  text = text.replace(/\+(\d{1,3})-(\d{3,10})(?:-(\d{3,7}))?/g, (match, country, middle, end) => {
    // Convert + to "plus"
    let result = 'plus ';
    
    // Convert each digit in country code individually
    result += country.split('').map((digit: string) => numberToWords(parseInt(digit))).join(' ');
    result += ', ';
    
    // Convert each digit in middle part individually
    result += middle.split('').map((digit: string) => numberToWords(parseInt(digit))).join(' ');
    
    // If there's an end part (third group), add it
    if (end) {
      result += ', ';
      result += end.split('').map((digit: string) => numberToWords(parseInt(digit))).join(' ');
    }
    
    return result;
  });
  
  // Handle plain 10 digit phone numbers (typically Indian mobile numbers)
  text = text.replace(/\b(\d{10})\b/g, (match) => {
    // Split into groups for better pronunciation: 98765 43210
    const part1 = match.substring(0, 5);
    const part2 = match.substring(5);
    
    const result = part1.split('').map((digit: string) => numberToWords(parseInt(digit))).join(' ') +
                   ', ' +
                   part2.split('').map((digit: string) => numberToWords(parseInt(digit))).join(' ');
    
    return result;
  });
  
  return text;
}

/**
 * Normalize email addresses for better pronunciation
 * Converts kaithalcourt@gov.in to "kaithalcourt at the rate g, o, v dot in"
 */
export function normalizeEmails(text: string): string {
  return text.replace(/([a-zA-Z0-9._+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, localPart, domain) => {
    // Handle the local part (before @)
    let result = localPart;
    
    // Replace common separators in email addresses
    result = result.replace(/\./g, ' dot ');
    result = result.replace(/_/g, ' underscore ');
    result = result.replace(/-/g, ' dash ');
    result = result.replace(/\+/g, ' plus ');
    
    result += ' at the rate ';
    
    // Handle domain part (after @)
    const domainParts = domain.split('.');
    
    for (let i = 0; i < domainParts.length; i++) {
      const part = domainParts[i];
      
      // Spell out EVERY domain part letter by letter
      // e.g., "gov" → "g, o, v", "court" → "c, o, u, r, t", "in" → "i, n"
      const letters = part.split('').join(', ');
      result += letters;
      
      // Add "dot" between parts (except for the last one)
      if (i < domainParts.length - 1) {
        result += ' dot ';
      }
    }
    
    return result;
  });
}

/**
 * Normalize numbers - handles all court-relevant patterns
 * Room numbers, case numbers, file numbers, general numbers
 */
export function normalizeNumbers(text: string): string {
  let result = text;

  // Case/file/suit/petition numbers (5+ digits) → digit by digit
  // e.g., "Case No. 12345" → "Case number one two three four five"
  result = result.replace(/\b(Case|File|Suit|Petition|Cause|FIR|CrPC|No\.?|Number)\s*[:\-#]?\s*(\d{5,})\b/gi, (match, label, num) => {
    const labelWord = label.replace(/No\.?/i, 'number').replace(/\./g, '');
    return `${labelWord} ${digitsToWords(num)}`;
  });

  // Room/Court numbers — 3+ digit → word form (e.g., "Room 104" → "Room one hundred and four")
  result = result.replace(/\b(Room|Court|Hall|Block|Gate|Floor|Counter|Window|Cabin|Office)\s+(\d{3,4})\b/gi, (match, label, num) => {
    const n = parseInt(num, 10);
    return `${label} ${numberToWords(n)}`;
  });

  // General 3-digit numbers (100-999) → word form
  result = result.replace(/\b(\d{3})\b/g, (match) => {
    const n = parseInt(match, 10);
    // Skip if it looks like a year (handled separately)
    if (n >= 100 && n <= 999) {
      return numberToWords(n);
    }
    return match;
  });

  // PIN codes / 6-digit numbers → digit by digit (e.g., "136027" → "one three six zero two seven")
  result = result.replace(/\bPIN\s*[:\-]?\s*(\d{6})\b/gi, (match, num) => {
    return `PIN ${digitsToWords(num)}`;
  });

  // Standalone 6-digit numbers that aren't phone numbers → digit by digit
  result = result.replace(/\b(\d{6})\b/g, (match) => digitsToWords(match));

  // Convert remaining standalone 1-2 digit numbers (1-100) to words
  result = result.replace(/\b(\d{1,2})\b/g, (match) => {
    const n = parseInt(match, 10);
    if (n >= 0 && n <= 100) {
      return numberToWords(n);
    }
    return match;
  });

  return result;
}

/**
 * Apply custom pronunciation mappings
 */
export function applyCustomPronunciations(text: string): string {
  let result = text;
  
  for (const [original, corrected] of Object.entries(customPronunciations)) {
    const regex = new RegExp(`\\b${original.replace(/\./g, '\\.')}\\b`, 'gi');
    result = result.replace(regex, corrected);
  }
  
  return result;
}

/**
 * Main normalization function - applies all normalizations in proper order
 */
export function normalizeTextForTTS(text: string): string {
  let normalized = text;
  
  // Step 1: Apply custom pronunciations first
  normalized = applyCustomPronunciations(normalized);
  
  // Step 2: Normalize URLs (before phone numbers to avoid conflicts)
  normalized = normalizeURLs(normalized);
  
  // Step 3: Normalize email addresses (before phone numbers to avoid conflicts)
  normalized = normalizeEmails(normalized);
  
  // Step 4: Normalize phone numbers (before general numbers)
  normalized = normalizePhoneNumbers(normalized);
  
  // Step 5: Normalize years (before general numbers)
  normalized = normalizeYears(normalized);
  
  // Step 6: Normalize times and AM/PM
  normalized = normalizeTimes(normalized);
  
  // Step 7: Normalize ordinals
  normalized = normalizeOrdinals(normalized);
  
  // Step 8: Normalize acronyms
  normalized = normalizeAcronyms(normalized);
  
  // Step 9: Normalize remaining numbers (careful not to conflict with years/times)
  normalized = normalizeNumbers(normalized);
  
  // Step 10: Clean up extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Test examples for development
 */
export function testNormalization() {
  const testCases = [
    "RKSD College was established in 1947.",
    "The timing is 8:00 AM to 5:00 PM.",
    "I got 1st rank in 2nd semester.",
    "Contact MBA office or BCA department.",
    "Classes start at 9 AM and end at 4 PM.",
    "The 21st century began in 2001.",
    "Call me at +91-1746-220103 for more information.",
    "Visit our website https://rksdcollege.ac.in for details.",
    "Send email to contact@court.gov.in or support@example.com",
    "Court timing: 9:30 AM se 5:30 PM, Monday to Friday",
    "Phone: 9876543210 or +91-124-4567890"
  ];
  
  console.log('=== Text Normalization Tests ===');
  testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}:`);
    console.log(`Original: "${test}"`);
    console.log(`Normalized: "${normalizeTextForTTS(test)}"`);
    console.log('');
  });
}
