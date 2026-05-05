/**
 * Court Static Data - Building Image + Room & Service Lookup System
 * This module provides static data structures for court navigation and service lookup
 */

export interface Building {
  name: string;
  image: string;
  description: string;
}

export interface Room {
  building: keyof typeof BUILDINGS;
  purpose: string;
}

export const BUILDINGS = {
  civil: {
    name: "Civil Block",
    image: "/images/court/civil_block.png",
    description: "Is building me courtrooms, judge chambers aur legal aid cell hota hai."
  },
  record: {
    name: "Record / Copy Section",
    image: "/images/court/record_section.png",
    description: "Yahan case records aur certified copy issue hoti hai."
  },
  filing: {
    name: "Filing & Registration Section",
    image: "/images/court/filing_section.png",
    description: "Yahan naye case ki filing, application submission aur stamp/token ka kaam hota hai."
  }
} as const;

export const ROOMS: Record<number, Room> = {
  // Civil Block Rooms
  21: { building: "civil", purpose: "Civil Courtroom (Hearing)" },
  22: { building: "civil", purpose: "Civil Courtroom (Hearing)" },
  23: { building: "civil", purpose: "Judge Chamber" },
  24: { building: "civil", purpose: "Waiting / Witness Area" },
  25: { building: "civil", purpose: "Legal Aid Cell (Free Legal Help)" },

  // Record / Copy Section Rooms
  11: { building: "record", purpose: "Old Case Record Storage" },
  12: { building: "record", purpose: "Record Index Search Desk" },
  13: { building: "record", purpose: "Copy Form Submission Counter" },
  14: { building: "record", purpose: "Certified Copy Issue Counter" },
  15: { building: "record", purpose: "Record Vault" },

  // Filing & Registration Section Rooms
  31: { building: "filing", purpose: "Filing Clerk Office" },
  32: { building: "filing", purpose: "Case Filing / Application Submission" },
  33: { building: "filing", purpose: "Affidavit Verification Desk" },
  34: { building: "filing", purpose: "Token Issue Counter" },
  35: { building: "filing", purpose: "Stamp / Payment Desk" }
};

export const SERVICES: Record<string, number> = {
  // File submission/filing
  "file submit": 32,
  "file jama": 32,
  "case file": 32,
  "application": 32,
  "filing": 32,
  "case filing": 32,
  "naya case": 32,
  "case register": 32,
  "file karna": 32,
  "file submit karna": 32,
  "application submit": 32,
  
  // Certified copy
  "certified copy": 14,
  "copy": 14,
  "case copy": 14,
  "copy leni": 14,
  "certified copy chahiye": 14,
  "copy issue": 14,
  "copy nikalna": 14,
  "record copy": 14,
  "nakal": 14,
  
  // Legal aid
  "legal aid": 25,
  "free legal help": 25,
  "mujhe vakil chahiye": 25,
  "lawyer chahiye": 25,
  "free lawyer": 25,
  "legal help": 25,
  "vakil ki madad": 25,
  "kanuni madad": 25,
  
  // Judge chamber
  "judge se milna": 23,
  "judge chamber": 23,
  "judge ka kamra": 23,
  
  // Hearing
  "hearing": 21,
  "court hearing": 21,
  "sunwai": 21,
  "case hearing": 21,
  
  // Affidavit
  "affidavit": 33,
  "affidavit verification": 33,
  "shapat patra": 33,
  
  // Token/Queue
  "token": 34,
  "queue number": 34,
  "number lena": 34,
  "token lena": 34,
  
  // Payment/Stamp
  "payment": 35,
  "stamp": 35,
  "fee payment": 35,
  "court fee": 35,
  "stamp paper": 35,
  "fee jama": 35,
  
  // Record search
  "record search": 12,
  "case record": 12,
  "purana record": 12,
  "record dekhna": 12,
  
  // Copy form
  "copy form": 13,
  "form submission": 13,
  "copy ke liye form": 13
};

/**
 * Helper Functions
 */

export interface LookupResult {
  matched: boolean;
  type?: 'service' | 'room' | 'building';
  roomNumber?: number;
  building?: keyof typeof BUILDINGS;
  buildingData?: Building;
  roomData?: Room;
  responseText?: string;
  spokenText?: string;
  imageUrl?: string;
}

/**
 * Match service keyword in user query and return room/building info
 */
export function matchService(query: string): LookupResult {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check service keywords
  for (const [keyword, roomNumber] of Object.entries(SERVICES)) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      const room = ROOMS[roomNumber];
      if (room) {
        const building = BUILDINGS[room.building];
        const responseText = `${room.purpose} ${building.name} ke Room ${roomNumber} me hai. ${building.description}`;
        const spokenText = `${room.purpose} ${building.name} ke Room ${roomNumber} me milti hai.`;
        
        return {
          matched: true,
          type: 'service',
          roomNumber,
          building: room.building,
          buildingData: building,
          roomData: room,
          responseText,
          spokenText,
          imageUrl: building.image
        };
      }
    }
  }
  
  return { matched: false };
}

/**
 * Match direct room number in query
 */
export function matchRoomNumber(query: string): LookupResult {
  const lowerQuery = query.toLowerCase();
  
  // Extract room number from query
  const roomNumberMatch = lowerQuery.match(/room\s*(?:number|no\.?|#)?\s*(\d+)/i) ||
                          lowerQuery.match(/kamra\s*(?:number|no\.?|#)?\s*(\d+)/i) ||
                          lowerQuery.match(/(\d+)\s*(?:room|kamra)/i);
  
  if (roomNumberMatch) {
    const roomNumber = parseInt(roomNumberMatch[1], 10);
    const room = ROOMS[roomNumber];
    
    if (room) {
      const building = BUILDINGS[room.building];
      const responseText = `Room ${roomNumber} ${building.name} me hai. Yeh ${room.purpose} ke liye use hota hai. ${building.description}`;
      const spokenText = `Room ${roomNumber} ${building.name} me hai. Yeh ${room.purpose} ke liye hai.`;
      
      return {
        matched: true,
        type: 'room',
        roomNumber,
        building: room.building,
        buildingData: building,
        roomData: room,
        responseText,
        spokenText,
        imageUrl: building.image
      };
    }
  }
  
  return { matched: false };
}

/**
 * Match building name in query
 */
export function matchBuilding(query: string): LookupResult {
  const lowerQuery = query.toLowerCase();
  
  // Check for building names
  if (lowerQuery.includes('civil block') || lowerQuery.includes('civil building')) {
    const building = BUILDINGS.civil;
    
    const responseText = `Civil Block me aapko courtrooms, judge chambers aur legal aid cell milenge. Hearing ke liye aap Room 21 ya Room 22 me ja sakte hain. Agar judge se milna hai to Room 23 me unka chamber hai. Aur agar aapko free legal help chahiye to Room 25 me Legal Aid Cell hai. ${building.description}`;
    const spokenText = `${building.name} me courtrooms, judge chambers aur legal aid cell hai. Hearing Room 21 ya 22 me hoti hai, aur legal help ke liye Room 25 me ja sakte hain.`;
    
    return {
      matched: true,
      type: 'building',
      building: 'civil',
      buildingData: building,
      responseText,
      spokenText,
      imageUrl: building.image
    };
  }
  
  if (lowerQuery.includes('record') && (lowerQuery.includes('section') || lowerQuery.includes('copy'))) {
    const building = BUILDINGS.record;
    
    const responseText = `Record Section me aapko purane case records aur certified copy milti hai. Agar aapko certified copy chahiye to Room 14 me ja sakte hain. Copy form submit karne ke liye Room 13 hai, aur record search ke liye Room 12 me help mil jayegi. ${building.description}`;
    const spokenText = `${building.name} me case records aur certified copy ka kaam hota hai. Certified copy ke liye Room 14 me ja sakte hain.`;
    
    return {
      matched: true,
      type: 'building',
      building: 'record',
      buildingData: building,
      responseText,
      spokenText,
      imageUrl: building.image
    };
  }
  
  if (lowerQuery.includes('filing') || lowerQuery.includes('registration')) {
    const building = BUILDINGS.filing;
    
    const responseText = `Filing Section me aap naya case file kar sakte hain ya application submit kar sakte hain. Case filing ke liye Room 32 me jaiye. Token lene ke liye Room 34 hai, aur stamp ya payment ke liye Room 35 me ja sakte hain. ${building.description}`;
    const spokenText = `${building.name} me naye case ki filing aur registration hoti hai. Filing ke liye Room 32 me ja sakte hain.`;
    
    return {
      matched: true,
      type: 'building',
      building: 'filing',
      buildingData: building,
      responseText,
      spokenText,
      imageUrl: building.image
    };
  }
  
  return { matched: false };
}

/**
 * Main lookup function - tries all matching strategies
 */
export function lookupCourtInfo(query: string): LookupResult {
  // Priority 1: Service keyword match
  let result = matchService(query);
  if (result.matched) return result;
  
  // Priority 2: Direct room number
  result = matchRoomNumber(query);
  if (result.matched) return result;
  
  // Priority 3: Building name
  result = matchBuilding(query);
  if (result.matched) return result;
  
  return { matched: false };
}
