/**
 * Court Query Analyzer
 * Analyzes user queries to determine court-specific data needs
 */

export interface CourtQueryTopics {
  courtrooms: boolean;
  buildings: boolean;
  staff: boolean;
  files: boolean;
  procedures: boolean;
  timings: boolean;
  directions: boolean;
  buildingImages: boolean;
  general: boolean;
  greeting: boolean;
}

export interface CourtQueryAnalysis {
  topics: CourtQueryTopics;
  entityMentions: {
    roomNumber?: string;
    buildingName?: string;
    staffName?: string;
    fileNumber?: string;
    designation?: string;
  };
  needsDetailedInfo: boolean;
}

export function analyzeCourtQuery(query: string): CourtQueryAnalysis {
  const lowerQuery = query.toLowerCase();
  
  const topics: CourtQueryTopics = {
    courtrooms: false,
    buildings: false,
    staff: false,
    files: false,
    procedures: false,
    timings: false,
    directions: false,
    buildingImages: false,
    general: false,
    greeting: false
  };

  const entityMentions: any = {};

  // Greeting detection
  const greetingPatterns = ['hello', 'hi', 'namaste', 'namaskar', 'hey', 'good morning', 'good evening'];
  if (greetingPatterns.some(pattern => lowerQuery.includes(pattern)) && lowerQuery.length < 30) {
    topics.greeting = true;
    return { topics, entityMentions, needsDetailedInfo: false };
  }

  // Courtroom detection
  const courtroomKeywords = ['courtroom', 'court room', 'room', 'court number', 'कोर्टरूम', 'कमरा'];
  if (courtroomKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.courtrooms = true;
  }

  // Room number extraction
  const roomNumberMatch = lowerQuery.match(/room\s*(?:number|no\.?|#)?\s*(\d+)/i) ||
                         lowerQuery.match(/courtroom\s*(\d+)/i) ||
                         lowerQuery.match(/कमरा\s*(?:संख्या)?\s*(\d+)/i);
  if (roomNumberMatch) {
    entityMentions.roomNumber = roomNumberMatch[1];
    topics.courtrooms = true;
  }

  // Building detection
  const buildingKeywords = ['building', 'block', 'bhawan', 'भवन', 'इमारत'];
  if (buildingKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.buildings = true;
  }

  // Staff detection
  const staffKeywords = ['judge', 'clerk', 'officer', 'registry', 'typist', 'staff', 'advocate', 'lawyer', 'जज', 'अधिकारी', 'कर्मचारी'];
  if (staffKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.staff = true;
  }

  // File detection
  const fileKeywords = ['file', 'case', 'document', 'petition', 'application', 'फाइल', 'केस', 'मामला'];
  if (fileKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.files = true;
  }

  // Procedures detection
  const procedureKeywords = ['procedure', 'process', 'how to', 'steps', 'filing', 'submit', 'प्रक्रिया', 'कैसे'];
  if (procedureKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.procedures = true;
  }

  // Timings detection
  const timingKeywords = ['timing', 'time', 'schedule', 'hours', 'open', 'close', 'समय', 'खुलने'];
  if (timingKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.timings = true;
  }

  // Directions detection
  const directionKeywords = ['where', 'location', 'find', 'navigate', 'direction', 'way', 'kaha', 'कहां', 'कैसे जाएं'];
  if (directionKeywords.some(kw => lowerQuery.includes(kw))) {
    topics.directions = true;
  }

  // Building Images detection - for location/navigation queries that need visual context
  const imageKeywords = ['show', 'image', 'photo', 'picture', 'look like', 'dikhao', 'दिखाओ', 'फोटो', 'तस्वीर'];
  const locationImageKeywords = ['submit', 'file', 'registry', 'counter', 'office', 'desk', 'department', 'section'];
  
  if (imageKeywords.some(kw => lowerQuery.includes(kw)) || 
     (topics.directions && locationImageKeywords.some(kw => lowerQuery.includes(kw)))) {
    topics.buildingImages = true;
  }

  // General query
  if (!Object.values(topics).some(v => v === true)) {
    topics.general = true;
  }

  const needsDetailedInfo = topics.courtrooms || topics.buildings || topics.staff || topics.files;

  return {
    topics,
    entityMentions,
    needsDetailedInfo
  };
}

export function getCourtDataFetchStrategy(analysis: CourtQueryAnalysis) {
  const { topics } = analysis;

  return {
    shouldFetchRooms: topics.courtrooms || topics.directions,
    shouldFetchBuildings: topics.buildings || topics.directions,
    shouldFetchStaff: topics.staff,
    shouldFetchFiles: topics.files,
    shouldFetchTimings: topics.timings,
    shouldFetchSettings: topics.general || topics.procedures,
    shouldFetchBuildingImages: topics.buildingImages || topics.directions,
    
    // Limits
    roomsLimit: topics.courtrooms ? 50 : 20,
    buildingsLimit: topics.buildings ? 10 : 5,
    staffLimit: topics.staff ? 30 : 10,
    filesLimit: topics.files ? 20 : 5,
    buildingImagesLimit: topics.buildingImages ? 10 : 5
  };
}

// Extract search keywords for building images
export function extractImageSearchKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const keywords: string[] = [];
  
  // Location-specific keywords
  const locationMap: { [key: string]: string[] } = {
    'registry': ['registry', 'रजिस्ट्री'],
    'counter': ['counter', 'काउंटर'],
    'file': ['file submission', 'filing', 'फाइल'],
    'courtroom': ['courtroom', 'कोर्टरूम'],
    'office': ['office', 'कार्यालय'],
    'entrance': ['entrance', 'entry', 'gate', 'प्रवेश'],
    'parking': ['parking', 'पार्किंग'],
    'cafeteria': ['cafeteria', 'canteen', 'कैंटीन'],
    'restroom': ['toilet', 'restroom', 'washroom', 'शौचालय'],
    'library': ['library', 'लाइब्रेरी']
  };

  for (const [category, patterns] of Object.entries(locationMap)) {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      keywords.push(category);
    }
  }

  return keywords;
}
