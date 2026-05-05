import { Express } from "express";
import { z } from "zod";
import { courtSessionManager } from "./court-session-manager";
import { analyzeCourtQuery, getCourtDataFetchStrategy, extractImageSearchKeywords } from "./court-query-analyzer";
import { supabase } from "./supabase";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { normalizeTextForTTS } from "./text-normalizer";
import { lookupCourtInfo } from "./court-static-data";
import { applyPronunciationCorrections } from "./pronunciation-corrections";

const askSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

const ttsSchema = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
  voiceId: z.string().optional(),
  modelId: z.string().optional(),
  stability: z.number().optional(),
  similarityBoost: z.number().optional(),
  cartesiaModelId: z.string().optional(),
  speed: z.union([
    z.enum(["slowest", "slow", "normal", "fast", "fastest"]),
    z.number().min(-1).max(1),
  ]).optional(),
  emotions: z.array(z.string()).optional(),
  language: z.string().optional(),
});

export async function registerCourtRoutes(app: Express) {
  // Court AI Assistant - Main Query Endpoint
  app.post("/api/court/ask", async (req, res) => {
    try {
      const { message, sessionId } = askSchema.parse(req.body);
      
      console.log(`\n🏛️ Court Assistant Query: "${message}"`);

      // Get or create session
      const { sessionId: activeSessionId, session } = courtSessionManager.getOrCreateSession(sessionId);

      // Analyze query
      const analysis = analyzeCourtQuery(message);
      const strategy = getCourtDataFetchStrategy(analysis);

      console.log('Court Query Analysis:', {
        topics: analysis.topics,
        entities: analysis.entityMentions,
        strategy
      });

      // PRIORITY: Try static lookup first for instant deterministic responses
      const staticLookup = lookupCourtInfo(message);
      
      if (staticLookup.matched) {
        console.log(`✅ Static lookup matched! Type: ${staticLookup.type}, Room: ${staticLookup.roomNumber || 'N/A'}`);
        
        // Build building image response structure
        const buildingImages = staticLookup.buildingData ? [{
          id: `static-${staticLookup.building}`,
          title: staticLookup.buildingData.name,
          description: staticLookup.buildingData.description,
          image_url: staticLookup.imageUrl || staticLookup.buildingData.image,
          room_number: staticLookup.roomNumber?.toString(),
          building_name: staticLookup.buildingData.name
        }] : [];
        
        // Prepend intro on very first message of conversation
        const isFirstMessage = session.messages.length === 0;
        let assistantResponse = staticLookup.responseText || "";
        if (isFirstMessage) {
          assistantResponse = `Namaste! Main Kaithal District Court ka WayFinder Assistant hoon. ${assistantResponse}`;
        }
        
        // Save conversation
        courtSessionManager.addMessage(activeSessionId, 'user', message);
        courtSessionManager.addMessage(activeSessionId, 'assistant', assistantResponse);
        
        console.log(`✅ Court Assistant Response (Static Lookup) - ${assistantResponse.length} chars`);
        
        return res.json({
          response: assistantResponse,
          sessionId: activeSessionId,
          buildingImages: buildingImages,
          metadata: {
            hasRoomInfo: !!staticLookup.roomNumber,
            hasBuildingInfo: !!staticLookup.building,
            hasStaffInfo: false,
            hasBuildingImages: buildingImages.length > 0,
            isStaticLookup: true
          }
        });
      }
      
      console.log('No static lookup match, proceeding with AI-powered response...');

      // Fetch relevant court data from Supabase
      let contextData: any = {
        rooms: [],
        buildings: [],
        staff: [],
        files: [],
        timings: [],
        settings: {},
        buildingImages: []
      };

      try {
        // Fetch courtrooms
        if (strategy.shouldFetchRooms) {
          const { data: rooms, error } = await supabase
            .from('court_rooms')
            .select('*')
            .eq('is_active', true)
            .limit(strategy.roomsLimit);
          
          if (!error && rooms) contextData.rooms = rooms;
        }

        // Fetch buildings
        if (strategy.shouldFetchBuildings) {
          const { data: buildings, error } = await supabase
            .from('court_buildings')
            .select('*')
            .eq('is_active', true)
            .limit(strategy.buildingsLimit);
          
          if (!error && buildings) contextData.buildings = buildings;
        }

        // Fetch staff
        if (strategy.shouldFetchStaff) {
          const { data: staff, error } = await supabase
            .from('court_staff')
            .select('*')
            .eq('is_active', true)
            .limit(strategy.staffLimit);
          
          if (!error && staff) contextData.staff = staff;
        }

        // Fetch files
        if (strategy.shouldFetchFiles) {
          const { data: files, error } = await supabase
            .from('court_files')
            .select('*')
            .eq('status', 'active')
            .limit(strategy.filesLimit);
          
          if (!error && files) contextData.files = files;
        }

        // Fetch timings
        if (strategy.shouldFetchTimings) {
          const { data: timings, error } = await supabase
            .from('court_timings')
            .select('*')
            .limit(10);
          
          if (!error && timings) contextData.timings = timings;
        }

        // Fetch court settings
        if (strategy.shouldFetchSettings) {
          const { data: settings, error } = await supabase
            .from('court_settings')
            .select('*')
            .limit(10);
          
          if (!error && settings) {
            contextData.settings = settings.reduce((acc: any, setting: any) => {
              acc[setting.key] = setting.value;
              return acc;
            }, {});
          }
        }

        // Fetch building images for location/navigation queries
        if (strategy.shouldFetchBuildingImages) {
          const searchKeywords = extractImageSearchKeywords(message);
          console.log('Building image search keywords:', searchKeywords);

          if (searchKeywords.length > 0) {
            // Search building images by matching keywords in title, description, or room_number
            const { data: buildingImages, error } = await supabase
              .from('court_building_images')
              .select('*')
              .limit(strategy.buildingImagesLimit);

            if (!error && buildingImages) {
              // Filter images based on keywords
              const matchingImages = buildingImages.filter((img: any) => {
                const searchableText = `${img.title} ${img.description} ${img.room_number} ${img.building_name} ${img.department}`.toLowerCase();
                return searchKeywords.some(keyword => searchableText.includes(keyword.toLowerCase()));
              });

              contextData.buildingImages = matchingImages.length > 0 ? matchingImages : buildingImages.slice(0, 3);
            }
          } else {
            // If no specific keywords, fetch a few general images
            const { data: buildingImages, error } = await supabase
              .from('court_building_images')
              .select('*')
              .limit(3);
            
            if (!error && buildingImages) contextData.buildingImages = buildingImages;
          }
        }
      } catch (dbError) {
        console.error('Court database fetch error:', dbError);
      }

      // Build professional system prompt for Court AI
      const systemPrompt = buildCourtSystemPrompt(contextData);

      // Get conversation history
      const messages = courtSessionManager.getConversationHistory(activeSessionId, systemPrompt);

      // Add current user message
      messages.push({ role: 'user', content: message });

      // LLM with Fallback: OpenAI GPT-4o → Groq Llama
      let assistantResponse = "";
      
      try {
        // PRIMARY: Try OpenAI GPT-4o first
        console.log('🤖 Court Assistant: Trying OpenAI GPT-4o...');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages as any[],
          temperature: 0.7,
          max_completion_tokens: 1000,
        });

        assistantResponse = completion.choices[0]?.message?.content || "";
        console.log('✅ OpenAI GPT-4o Success');

      } catch (openaiError: any) {
        // FALLBACK: Use Groq if OpenAI fails
        console.warn('⚠️ OpenAI GPT-4o failed, falling back to Groq...', openaiError.message);
        
        try {
          const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY, // Assistant Groq key
          });

          const groqCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages as any[],
            temperature: 0.7,
            max_tokens: 1000,
          });

          assistantResponse = groqCompletion.choices[0]?.message?.content || "";
          console.log('✅ Groq Llama Success (Fallback)');

        } catch (groqError: any) {
          console.error('❌ Both OpenAI and Groq failed:', groqError.message);
          assistantResponse = "Namaste! Main Kaithal District Court ka WayFinder Assistant hoon. Abhi technical difficulty aa rahi hai, please thodi der baad try karein.";
        }
      }

      if (!assistantResponse) {
        assistantResponse = "Khed hai, main abhi request process nahi kar pa raha. Kripya thodi der baad try karein.";
      }

      // ──────────────────────────────────────────────────────────────────────
      // 🧠 STEP 2: GREETING DETECTION
      // ──────────────────────────────────────────────────────────────────────
      const greetingKeywords = [
        'namaste', 'namaskar', 'hello', 'hi ', 'hey', 'shukriya', 'dhanyavad',
        'thank you', 'thanks', 'shukriya', 'bye', 'goodbye', 'alvida', 'acha',
        'theek hai', 'ok', 'okay'
      ];
      const lowerMsg = message.toLowerCase();
      const isGreeting = greetingKeywords.some(k => lowerMsg.includes(k)) && message.trim().split(/\s+/).length <= 4;
      console.log(`👋 Greeting detected: ${isGreeting}`);

      // ──────────────────────────────────────────────────────────────────────
      // 🌐 STEP 3: SERPAPI WEB SEARCH (when AI doesn't know)
      // ──────────────────────────────────────────────────────────────────────
      const uncertainPhraseCheck = assistantResponse.toLowerCase();
      const indicatesNoInfo =
        uncertainPhraseCheck.includes("mujhe nahi pata") ||
        uncertainPhraseCheck.includes("mujhe iska pata nahi") ||
        uncertainPhraseCheck.includes("mere paas") ||
        uncertainPhraseCheck.includes("jaankari nahin") ||
        uncertainPhraseCheck.includes("jankari nahi") ||
        uncertainPhraseCheck.includes("information nahi") ||
        uncertainPhraseCheck.includes("i don't know") ||
        uncertainPhraseCheck.includes("i don't have") ||
        uncertainPhraseCheck.includes("i'm not sure") ||
        uncertainPhraseCheck.includes("i am not sure") ||
        uncertainPhraseCheck.includes("khed hai") ||
        uncertainPhraseCheck.includes("sorry") ||
        uncertainPhraseCheck.includes("maaf kijiye") ||
        uncertainPhraseCheck.includes("pata nahi hai") ||
        uncertainPhraseCheck.includes("jaankari nahi hai");

      const shouldSearchWeb = !isGreeting && indicatesNoInfo;
      let serpApiUsed = false;

      console.log(`\n🔍 ===== COURT WEB SEARCH DECISION =====`);
      console.log(`📝 AI Response: "${assistantResponse.substring(0, 100)}..."`);
      console.log(`❓ AI indicates no info: ${indicatesNoInfo}`);
      console.log(`🌐 Should search web: ${shouldSearchWeb}`);
      console.log(`========================================\n`);

      if (shouldSearchWeb) {
        try {
          console.log(`\n🔍 ===== STARTING COURT SERPAPI SEARCH =====`);
          const serpApiKey = process.env.SERPAPI_API_KEY;

          if (serpApiKey) {
            const searchQuery = `${message} Kaithal District Court`;
            const serpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}&hl=en&gl=in`;

            console.log(`🔎 Search query: "${searchQuery}"`);
            const searchResponse = await fetch(serpApiUrl);

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              let searchInfo = "";

              // Extract AI Overview if available
              if (searchData.ai_overview) {
                console.log("✅ AI Overview found!");
                let aiOverview = searchData.ai_overview;

                if (aiOverview.page_token) {
                  const followUpUrl = `https://serpapi.com/search.json?engine=google_ai_overview&page_token=${aiOverview.page_token}&api_key=${serpApiKey}`;
                  try {
                    const followUpRes = await fetch(followUpUrl);
                    if (followUpRes.ok) {
                      const followUpData = await followUpRes.json();
                      if (followUpData.ai_overview) aiOverview = followUpData.ai_overview;
                    }
                  } catch (e) {}
                }

                if (aiOverview.text_blocks && Array.isArray(aiOverview.text_blocks)) {
                  const textParts: string[] = [];
                  const processListItems = (items: any[], depth = 0) => {
                    items.forEach((item: any) => {
                      const parts = [];
                      if (item.title) parts.push(item.title);
                      if (item.snippet) parts.push(item.snippet);
                      if (parts.length > 0) textParts.push("  ".repeat(depth) + "• " + parts.join(": "));
                      if (item.list && Array.isArray(item.list)) processListItems(item.list, depth + 1);
                    });
                  };
                  aiOverview.text_blocks.forEach((block: any) => {
                    if (block.type === "paragraph" || block.type === "heading") {
                      if (block.snippet) textParts.push(block.snippet);
                    } else if (block.type === "list" && block.list) {
                      processListItems(block.list);
                    } else if (block.snippet) {
                      textParts.push(block.snippet);
                    }
                  });
                  searchInfo = textParts.filter(Boolean).join("\n");
                }
              }

              // Fallback to organic results if no AI Overview
              if (!searchInfo && searchData.organic_results && searchData.organic_results.length > 0) {
                console.log("⚠️ No AI Overview, using organic results...");
                const topResults = searchData.organic_results.slice(0, 3);
                searchInfo = topResults
                  .map((r: any) => `${r.title}: ${r.snippet || ""}`)
                  .filter(Boolean)
                  .join("\n");
              }

              if (searchInfo && searchInfo.trim().length > 20) {
                console.log("✅ Web search info found, regenerating court response...");
                serpApiUsed = true;

                const courtContext = `
=== 🔍 Google Search Results for "${message}" ===
${searchInfo}

=== 📚 Supabase Court Data ===
Rooms: ${contextData.rooms.length}, Buildings: ${contextData.buildings.length}, Staff: ${contextData.staff.length}
`;

                const enhancedSystemPrompt = `${systemPrompt}

🚨 CRITICAL: Google search results found for "${message}". Use this data as PRIMARY source:

${searchInfo}

Respond in Hinglish. Keep response focused on Kaithal District Court information only.`;

                try {
                  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                  const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                      { role: "system", content: enhancedSystemPrompt },
                      { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_completion_tokens: 600,
                  });
                  const webResponse = completion.choices[0]?.message?.content;
                  if (webResponse && webResponse.trim().length > 10) {
                    assistantResponse = webResponse;
                    console.log("✅ Court web-search-enhanced response ready");
                  }
                } catch (openaiWebErr) {
                  console.warn("⚠️ OpenAI web response failed:", openaiWebErr);
                }
              } else {
                console.log("⚠️ No useful web search results for court query");
                assistantResponse = "Is baare mein mujhe accurate information nahi mili. Kripya Kaithal District Court reception par sampark karein ya ecourts.gov.in check karein.";
              }
            }
          } else {
            console.log("⚠️ SerpAPI key not configured");
            assistantResponse = "Is baare mein accurate information uplabdh nahi hai. Kripya Kaithal District Court mein seedha sampark karein.";
          }
        } catch (searchError) {
          console.error("❌ Court SerpAPI search error:", searchError);
          assistantResponse = "Is baare mein accurate information uplabdh nahi hai. Kripya Kaithal District Court mein seedha sampark karein.";
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // 🔍 STEP 4: CROSS-VERIFICATION WITH GROQ REGENERATION
      // ──────────────────────────────────────────────────────────────────────
      if (!serpApiUsed) {
        try {
          console.log(`\n🔍 ===== COURT CROSS-VERIFICATION LAYER =====`);
          let needsRegeneration = false;
          let regenerationReason = "";

          // Check 1: Empty or too short
          if (!assistantResponse || assistantResponse.trim().length < 10) {
            needsRegeneration = true;
            regenerationReason = "Response too short or empty";
          }

          // Check 2: Still uncertain after DB lookup
          if (!needsRegeneration && !isGreeting) {
            const stillUncertain = [
              "mujhe nahi pata", "i don't know", "pata nahi",
              "information unavailable", "currently unavailable",
              "mujhe iska pata nahi", "jaankari nahin"
            ].some(p => assistantResponse.toLowerCase().includes(p));

            if (stillUncertain && (contextData.rooms.length > 0 || contextData.buildings.length > 0 || contextData.staff.length > 0)) {
              needsRegeneration = true;
              regenerationReason = "AI uncertain despite having DB data — forcing more specific answer";
            }
          }

          // Regenerate with Groq if needed
          if (needsRegeneration) {
            console.log(`\n🔄 ===== COURT REGENERATING WITH GROQ =====`);
            console.log(`❌ Reason: ${regenerationReason}`);

            const groqApiKey = process.env.GROQ_API_KEY;
            if (groqApiKey) {
              try {
                const stricterPrompt = systemPrompt + `\n\nIMPORTANT: Pichhli response bahut vague thi. Available court data se specific aur confident jawab do. Agar exact info nahi hai, batao ki court reception se poochhein.`;
                const retryMessages = [
                  { role: "system", content: stricterPrompt },
                  { role: "user", content: message }
                ];

                const groq = new Groq({ apiKey: groqApiKey });
                const retryCompletion = await groq.chat.completions.create({
                  model: "llama-3.3-70b-versatile",
                  messages: retryMessages as any[],
                  temperature: 0.5,
                  max_tokens: 500,
                });

                const newResponse = retryCompletion.choices[0]?.message?.content;
                if (newResponse && newResponse.trim().length > 10) {
                  assistantResponse = newResponse;
                  console.log("✅ Court response regenerated via Groq");
                } else {
                  console.log("⚠️ Groq regeneration returned empty, using fallback");
                  assistantResponse = "Is baare mein accurate information uplabdh nahi hai. Kripya Kaithal District Court reception par sampark karein.";
                }
              } catch (regenError) {
                console.error("❌ Groq regeneration error:", regenError);
                assistantResponse = "Is baare mein accurate information uplabdh nahi hai. Kripya Kaithal District Court reception par sampark karein.";
              }
            }
          }

          console.log(`\n✅ ===== COURT VERIFICATION COMPLETE =====`);
          console.log(`🔄 Regenerated: ${needsRegeneration ? "Yes — " + regenerationReason : "No"}`);
          console.log(`📝 Final Response Length: ${assistantResponse.length} chars`);
          console.log(`==========================================\n`);
        } catch (verifyError) {
          console.error("❌ Court cross-verification error:", verifyError);
        }
      }

      // Save conversation
      courtSessionManager.addMessage(activeSessionId, 'user', message);
      courtSessionManager.addMessage(activeSessionId, 'assistant', assistantResponse);

      console.log(`✅ Court Assistant Response Generated (${assistantResponse.length} chars)`);

      res.json({
        response: assistantResponse,
        sessionId: activeSessionId,
        buildingImages: contextData.buildingImages || [],
        metadata: {
          hasRoomInfo: contextData.rooms.length > 0,
          hasBuildingInfo: contextData.buildings.length > 0,
          hasStaffInfo: contextData.staff.length > 0,
          hasBuildingImages: (contextData.buildingImages || []).length > 0
        }
      });

    } catch (error: any) {
      console.error('Court assistant error:', error);
      res.status(500).json({
        response: "I apologize for the inconvenience. There was an error processing your request. Please try again.",
        error: error.message
      });
    }
  });

  // Court TTS Endpoint - Cartesia (Primary) → ElevenLabs (Fallback) → OpenAI (Final Fallback)
  app.post("/api/court/tts", async (req, res) => {
    try {
      const { text, voiceId, voice, modelId, stability, similarityBoost, cartesiaModelId, speed, emotions, language } = ttsSchema.parse(req.body);

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Text cannot be empty", error: "EMPTY_TEXT" });
      }

      console.log(`🔊 Court TTS Request: ${text.substring(0, 50)}...`);

      const cleanTextForSpeech = (raw: string) => {
        return raw
          .replace(/\|/g, " ")
          .replace(/---+/g, ". ")
          .replace(/#{1,6}\s+/g, "")
          .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/__(.*?)__/g, "$1")
          .replace(/_(.*?)_/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/\(https?:\/\/[^\)]+\)/g, "")
          .replace(/📊|📌|🎓|⏰|📞|⚖️|✅|❌|🔊|🎯|📧|📍/g, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const detectLanguage = (text: string): "hi" | "en" => {
        const hindiWords = ["aap", "hai", "hain", "kya", "kaise", "kahan", "namaste", "main", "hum", "kar", "karo", "karna", "kiya", "madad", "court", "se", "ko", "ke", "ki", "ka", "me", "mein", "par", "pe", "tak", "aur", "ya", "lekin", "agar", "to", "phir", "kyun", "kab", "kaun", "kitna"];
        const lowerText = text.toLowerCase();
        const hindiWordCount = hindiWords.filter((word) => lowerText.includes(word)).length;
        const totalWords = text.split(/\s+/).length;
        return hindiWordCount / totalWords > 0.2 ? "hi" : "en";
      };

      const cleanedText = cleanTextForSpeech(text);
      const correctedText = applyPronunciationCorrections(cleanedText);
      const normalizedText = normalizeTextForTTS(correctedText);
      const detectedLanguage = language || detectLanguage(cleanedText);

      console.log(`⚡ Court TTS: Optimized synthesis for text: ${cleanedText.substring(0, 50)}...`);
      console.log(`Court TTS: Text length: ${cleanedText.length}, Language: ${detectedLanguage}`);

      const MAX_CHAR_LIMIT = 4500;
      let finalText = normalizedText;
      if (normalizedText.length > MAX_CHAR_LIMIT) {
        finalText = normalizedText.substring(0, MAX_CHAR_LIMIT);
        const lastEnd = Math.max(finalText.lastIndexOf("."), finalText.lastIndexOf("?"), finalText.lastIndexOf("!"));
        if (lastEnd > MAX_CHAR_LIMIT * 0.8) finalText = normalizedText.substring(0, lastEnd + 1);
      }

      const cartesiaApiKey = process.env.CARTESIA_API_KEY;
      const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
      const openaiApiKey = process.env.OPENAI_API_KEY;

      // TIER 1: Cartesia TTS (Primary)
      if (cartesiaApiKey && cartesiaApiKey !== "your_cartesia_api_key_here") {
        try {
          console.log("⚡ Court TTS: Trying Cartesia (Tier 1 - Primary)...");
          const cartesiaVoiceMapping: Record<string, string> = {
            iWNf11sz1GrUE4ppxTOL: "fd2ada67-c2d9-4afe-b474-6386b87d8fc3",
          };
          const cartesiaVoiceId = (voiceId && cartesiaVoiceMapping[voiceId]) || "fd2ada67-c2d9-4afe-b474-6386b87d8fc3";
          const defaultEmotions = emotions && emotions.length > 0 ? emotions : ["positivity"];

          const cartesiaBody = {
            model_id: cartesiaModelId || "sonic-2.0",
            transcript: finalText,
            voice: {
              mode: "id",
              id: cartesiaVoiceId,
              __experimental_controls: {
                speed: typeof speed === "string" ? speed : "normal",
                emotion: defaultEmotions,
              },
            },
            output_format: {
              container: "wav",
              encoding: "pcm_s16le",
              sample_rate: 44100,
            },
            language: detectedLanguage,
          };

          const cartesiaResponse = await fetch("https://api.cartesia.ai/tts/bytes", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${cartesiaApiKey}`,
              "Cartesia-Version": "2025-04-16",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cartesiaBody),
          });

          if (cartesiaResponse.ok) {
            const audioBuffer = await cartesiaResponse.arrayBuffer();
            console.log(`✅ Court TTS: Cartesia success! Audio size: ${audioBuffer.byteLength} bytes`);
            res.set({
              "Content-Type": "audio/wav",
              "Content-Length": audioBuffer.byteLength.toString(),
              "X-TTS-Provider": "cartesia",
            });
            return res.send(Buffer.from(audioBuffer));
          } else {
            const errText = await cartesiaResponse.text();
            throw new Error(`Cartesia failed (${cartesiaResponse.status}): ${errText}`);
          }
        } catch (cartesiaErr) {
          console.warn("⚠️ Court TTS: Cartesia failed, trying ElevenLabs (Tier 2)...", cartesiaErr);

          // TIER 2: ElevenLabs Fallback
          if (elevenlabsApiKey && elevenlabsApiKey !== "your_elevenlabs_api_key_here") {
            try {
              console.log("⚡ Court TTS: Trying ElevenLabs (Tier 2 - Fallback)...");
              const elevenVoiceId = voiceId || voice || "3AMU7jXQuQa3oRvRqUmb";
              const elevenBody = {
                text: finalText,
                model_id: modelId || "eleven_multilingual_v2",
                voice_settings: {
                  stability: stability || 0.55,
                  similarity_boost: similarityBoost || 0.7,
                  style: 0.4,
                  use_speaker_boost: true,
                },
              };

              const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
                method: "POST",
                headers: { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": elevenlabsApiKey },
                body: JSON.stringify(elevenBody),
              });

              if (elevenResponse.ok) {
                const audioBuffer = await elevenResponse.arrayBuffer();
                console.log(`✅ Court TTS: ElevenLabs fallback success! Audio size: ${audioBuffer.byteLength} bytes`);
                res.set({
                  "Content-Type": "audio/mpeg",
                  "Content-Length": audioBuffer.byteLength.toString(),
                  "X-TTS-Provider": "elevenlabs",
                });
                return res.send(Buffer.from(audioBuffer));
              } else {
                const errText = await elevenResponse.text();
                throw new Error(`ElevenLabs failed (${elevenResponse.status}): ${errText}`);
              }
            } catch (elevenErr) {
              console.warn("⚠️ Court TTS: ElevenLabs failed, trying OpenAI TTS (Tier 3)...", elevenErr);
            }
          } else {
            console.warn("⚠️ Court TTS: ElevenLabs not configured, trying OpenAI TTS (Tier 3)...");
          }

          // TIER 3: OpenAI TTS Final Fallback
          if (openaiApiKey) {
            try {
              console.log("⚡ Court TTS: Trying OpenAI TTS (Tier 3 - Final Fallback)...");
              const openai = new OpenAI({ apiKey: openaiApiKey });
              const mp3Response = await openai.audio.speech.create({
                model: "tts-1",
                voice: "ash",
                input: finalText,
                speed: 1.0,
              });
              const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
              console.log(`✅ Court TTS: OpenAI final fallback success! Audio size: ${audioBuffer.byteLength} bytes`);
              res.set({
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
                "X-TTS-Provider": "openai",
              });
              return res.send(audioBuffer);
            } catch (openaiErr) {
              console.error("❌ Court TTS: All 3 providers failed (Cartesia, ElevenLabs, OpenAI):", openaiErr);
            }
          } else {
            console.error("❌ Court TTS: OpenAI not configured for final fallback");
          }
        }
      } else {
        // No Cartesia — try ElevenLabs directly
        if (elevenlabsApiKey && elevenlabsApiKey !== "your_elevenlabs_api_key_here") {
          try {
            console.log("⚡ Court TTS: Trying ElevenLabs (Tier 2 - No Cartesia)...");
            const elevenVoiceId = voiceId || voice || "3AMU7jXQuQa3oRvRqUmb";
            const elevenBody = {
              text: finalText,
              model_id: modelId || "eleven_multilingual_v2",
              voice_settings: { stability: stability || 0.55, similarity_boost: similarityBoost || 0.7, style: 0.4, use_speaker_boost: true },
            };
            const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
              method: "POST",
              headers: { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": elevenlabsApiKey },
              body: JSON.stringify(elevenBody),
            });
            if (elevenResponse.ok) {
              const audioBuffer = await elevenResponse.arrayBuffer();
              res.set({ "Content-Type": "audio/mpeg", "Content-Length": audioBuffer.byteLength.toString(), "X-TTS-Provider": "elevenlabs" });
              return res.send(Buffer.from(audioBuffer));
            }
          } catch (elevenErr) {
            console.warn("⚠️ Court TTS: ElevenLabs failed too.", elevenErr);
          }
        }
        if (openaiApiKey) {
          try {
            console.log("⚡ Court TTS: Trying OpenAI TTS (Tier 3)...");
            const openai = new OpenAI({ apiKey: openaiApiKey });
            const mp3Response = await openai.audio.speech.create({ model: "tts-1", voice: "ash", input: finalText, speed: 1.0 });
            const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
            res.set({ "Content-Type": "audio/mpeg", "Content-Length": audioBuffer.byteLength.toString(), "X-TTS-Provider": "openai" });
            return res.send(audioBuffer);
          } catch (openaiErr) {
            console.error("❌ Court TTS: OpenAI also failed:", openaiErr);
          }
        }
      }

      return res.status(500).json({ message: "TTS generation failed - all providers unavailable", error: "ALL_TTS_FAILED" });

    } catch (error: any) {
      console.error("❌ Court TTS error:", error);
      res.status(500).json({ message: "TTS generation failed", error: error.message });
    }
  });

  // OpenAI TTS Endpoint for Court Assistant (Fallback with "ash" voice)
  app.post("/api/court/tts-openai", async (req, res) => {
    try {
      const { text } = ttsSchema.parse(req.body);

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          message: "Text cannot be empty",
          error: "EMPTY_TEXT"
        });
      }

      console.log(`🔊 Court TTS Request (OpenAI - ash voice): ${text.substring(0, 50)}...`);

      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        console.error('❌ OpenAI API key not configured');
        return res.status(500).json({
          message: "OpenAI TTS service not configured",
          error: "OPENAI_KEY_MISSING"
        });
      }

      // Comprehensive text cleaning for TTS - remove ALL markdown and special formatting
      const cleanTextForSpeech = (text: string) => {
        return text
          .replace(/\|/g, ' ')
          .replace(/---+/g, '. ')
          .replace(/#{1,6}\s+/g, '')
          // Remove triple asterisks first (before double)
          .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
          // Remove double asterisks (bold)
          .replace(/\*\*(.*?)\*\*/g, '$1')
          // Remove single asterisks (italic)
          .replace(/\*(.*?)\*/g, '$1')
          // Remove underscores (bold/italic)
          .replace(/__(.*?)__/g, '$1')
          .replace(/_(.*?)_/g, '$1')
          // Remove inline code
          .replace(/`(.*?)`/g, '$1')
          // Remove markdown links [text](url) - keep only text
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          // Remove standalone URLs in parentheses
          .replace(/\(https?:\/\/[^\)]+\)/g, '')
          // Remove emojis
          .replace(/📊|📌|🎓|⏰|📞|⚖️|✅|❌|🔊|🎯|📧|📍/g, '')
          // Clean up multiple spaces
          .replace(/\s+/g, ' ')
          .trim();
      };

      const cleanedText = cleanTextForSpeech(text);
      
      // Apply text normalization for proper pronunciation of times, phone numbers, emails, etc.
      const normalizedText = normalizeTextForTTS(cleanedText);

      console.log(`Court TTS (OpenAI): Processing text (${normalizedText.length} characters)...`);
      console.log(`Court TTS (OpenAI): Normalized text preview: "${normalizedText.substring(0, 100)}..."`);

      // OpenAI TTS has a 4096 character limit
      const MAX_CHAR_LIMIT = 4000;
      let finalText = normalizedText;
      
      if (normalizedText.length > MAX_CHAR_LIMIT) {
        console.warn(`⚠️ Court TTS (OpenAI): Text exceeds ${MAX_CHAR_LIMIT} chars. Truncating...`);
        
        finalText = normalizedText.substring(0, MAX_CHAR_LIMIT);
        const lastPeriod = finalText.lastIndexOf('.');
        const lastQuestion = finalText.lastIndexOf('?');
        const lastExclamation = finalText.lastIndexOf('!');
        
        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
        if (lastSentenceEnd > MAX_CHAR_LIMIT * 0.8) {
          finalText = normalizedText.substring(0, lastSentenceEnd + 1);
        }
      }

      // OpenAI TTS API Call - using "ash" voice for natural, smooth speech
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: finalText,
          voice: 'ash',
          speed: 1.0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenAI TTS failed (${response.status}):`, errorText);
        throw new Error(`OpenAI TTS API error (${response.status})`);
      }

      const audioBuffer = await response.arrayBuffer();
      const finalAudio = Buffer.from(audioBuffer);

      console.log(`✅ Court TTS (OpenAI): Complete! Generated ${finalAudio.length} bytes with ash voice`);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': finalAudio.length,
        'X-TTS-Provider': 'openai',
        'X-TTS-Voice': 'ash',
        'X-TTS-Mode': 'continuous'
      });

      res.send(finalAudio);

    } catch (error: any) {
      console.error('❌ Court TTS (OpenAI) error:', error);
      res.status(500).json({
        message: "OpenAI TTS generation failed",
        error: error.message
      });
    }
  });
}

function buildCourtSystemPrompt(contextData: any): string {
  const { rooms, buildings, staff, files, timings, settings, buildingImages } = contextData;

  let prompt = `You are WayFinder, the official AI Voice Assistant for Kaithal District Court.
Your full identity is "Main Kaithal District Court ka WayFinder Assistant hoon".

🚫 OFF-TOPIC RULE — STRICTLY FOLLOW:
If the user's query is NOT related to Kaithal District Court (e.g., cricket, politics, Bollywood, cooking, weather, college matters, general knowledge, personal advice, other institutions, etc.), respond ONLY with this:
"Main sirf Kaithal District Court se related questions answer kar sakta hoon. Court ke baare mein kuch poochhna ho to zaroor batayein — main madad karne ke liye available hoon!"
Do NOT attempt to answer off-topic questions, even partially.

🎤 INTRO RULE — STRICTLY FOLLOW:
When the user sends their VERY FIRST message (no previous assistant messages in conversation history), ALWAYS start your response with a brief introduction: "Namaste! Main Kaithal District Court ka WayFinder Assistant hoon." — then IMMEDIATELY answer their question in the same response. If the conversation is already ongoing (previous messages exist), do NOT repeat your intro. Go straight to answering.

**YOUR ROLE:**
- Guide visitors, lawyers, litigants, and staff through the court premises
- Provide accurate information about courtroom locations, file tracking, and staff directories
- Help users navigate the court complex efficiently
- Answer questions about court procedures, timings, and facilities
- Maintain a professional, respectful, and courteous tone at all times

**LANGUAGE & COMMUNICATION STYLE:**
- **PRIMARY LANGUAGE**: Always respond in Hinglish (Hindi + English mix) by default
- Use Hindi words mixed with English naturally, like people speak in India: "Courtroom number 5 main hall ke left side par hai"
- Examples of Hinglish responses:
  * "Ji haan, main aapki madad kar sakta hoon. Courtroom 5 ground floor par hai."
  * "File tracking ke liye aapko registry office jana hoga jo building A mein hai."
  * "Staff directory dekhne ke liye main aapko details de sakta hoon."
- **ENGLISH MODE**: If user specifically asks in pure English or says "speak in English", then respond in pure English
- Be professional yet approachable
- Use simple, clear language that anyone can understand
- Be concise but comprehensive
- Always be respectful and helpful
- Use bullet points for clarity when providing multiple details
- When giving directions, be specific about building, floor, and room numbers

**CRITICAL FORMATTING RULES - MUST FOLLOW:**
- NEVER use ANY markdown formatting: no **, ***, *, __, [], (), etc.
- NEVER use bold, italic, or links in your responses
- Keep responses simple and plain text only
- Use simple dashes (-) for lists, nothing else
- DO NOT wrap text in asterisks or any special characters

**CORRECT FORMAT (Use this):**
"Court ka email hai kaithalcourt@gov.in aur phone number hai +91-1746-234567"
"Email: kaithalcourt@gov.in"
"Reception: +91-1746-234567"

**WRONG FORMAT (Never use this):**
"**Email:** kaithalcourt@gov.in" ❌
"[website](https://example.com)" ❌
"***Important:*** Contact us" ❌

This is essential for voice assistant - markdown breaks text-to-speech!

**CURRENT COURT DATA:**\n\n`;

  // Add court settings
  if (settings && Object.keys(settings).length > 0) {
    prompt += `**Court Information:**\n`;
    Object.entries(settings).forEach(([key, value]) => {
      prompt += `- ${key}: ${JSON.stringify(value)}\n`;
    });
    prompt += `\n`;
  }

  // Add buildings info
  if (buildings && buildings.length > 0) {
    prompt += `**Court Buildings:**\n`;
    buildings.forEach((building: any) => {
      prompt += `- ${building.building_name} (${building.building_code || 'N/A'})\n`;
      if (building.description) prompt += `  Description: ${building.description}\n`;
      if (building.total_floors) prompt += `  Floors: ${building.total_floors}\n`;
      if (building.location_details) prompt += `  Location: ${building.location_details}\n`;
    });
    prompt += `\n`;
  }

  // Add rooms info
  if (rooms && rooms.length > 0) {
    prompt += `**Courtrooms & Offices:**\n`;
    rooms.slice(0, 30).forEach((room: any) => {
      prompt += `- Room ${room.room_number}: ${room.room_name || room.room_type}\n`;
      if (room.room_purpose) prompt += `  Purpose: ${room.room_purpose}\n`;
      if (room.floor_number) prompt += `  Floor: ${room.floor_number}\n`;
      if (room.incharge_name) prompt += `  In-charge: ${room.incharge_name}\n`;
      if (room.timings) prompt += `  Timings: ${room.timings}\n`;
    });
    prompt += `\n`;
  }

  // Add staff info
  if (staff && staff.length > 0) {
    prompt += `**Court Staff:**\n`;
    staff.slice(0, 20).forEach((person: any) => {
      prompt += `- ${person.staff_name} - ${person.designation}\n`;
      if (person.department) prompt += `  Department: ${person.department}\n`;
      if (person.specialization) prompt += `  Specialization: ${person.specialization}\n`;
      if (person.office_hours) prompt += `  Office Hours: ${person.office_hours}\n`;
    });
    prompt += `\n`;
  }

  // Add timings
  if (timings && timings.length > 0) {
    prompt += `**Court Timings:**\n`;
    timings.forEach((timing: any) => {
      prompt += `- ${timing.facility_name}: ${timing.opening_time} - ${timing.closing_time}\n`;
      if (timing.days) prompt += `  Days: ${timing.days.join(', ')}\n`;
      if (timing.special_notes) prompt += `  Note: ${timing.special_notes}\n`;
    });
    prompt += `\n`;
  }

  // Add file tracking info if available
  if (files && files.length > 0) {
    prompt += `**Recent File Locations:**\n`;
    files.slice(0, 10).forEach((file: any) => {
      prompt += `- File ${file.file_number}: ${file.current_location}\n`;
      if (file.file_type) prompt += `  Type: ${file.file_type}\n`;
      if (file.status) prompt += `  Status: ${file.status}\n`;
    });
    prompt += `\n`;
  }

  // Add building images for visual context
  if (buildingImages && buildingImages.length > 0) {
    prompt += `**Available Building Images (for location/navigation help):**\n`;
    buildingImages.forEach((img: any) => {
      prompt += `- ${img.title}\n`;
      if (img.description) prompt += `  Description: ${img.description}\n`;
      if (img.room_number) prompt += `  Room: ${img.room_number}\n`;
      if (img.building_name) prompt += `  Building: ${img.building_name}\n`;
      if (img.department) prompt += `  Department: ${img.department}\n`;
      if (img.contact_person) prompt += `  Contact: ${img.contact_person}\n`;
      prompt += `  Image available: Yes (will be shown to user)\n`;
    });
    prompt += `\n`;
    prompt += `**NOTE**: When answering location/navigation questions, if there's a relevant building image available, mention that an image is being shown to help them visualize the location.\n\n`;
  }

  prompt += `**IMPORTANT GUIDELINES:**
- If a user asks about a specific file, room, or staff member, provide complete details including location, timings, and contact information
- When describing locations, always mention: Building name → Floor → Room number
- If you don't have specific information, politely inform the user and suggest they contact the court office
- For legal procedures, provide general guidance but advise consulting with court staff or legal professionals for specific cases
- Always maintain confidentiality and professionalism

Remember: You are here to help people navigate the court system easily and efficiently. Be patient, clear, and helpful!`;

  return prompt;
}
