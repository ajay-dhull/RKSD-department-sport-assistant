/**
 * Clean TTS Route Implementation 
 * Keeps working sequential processing + all optimizations
 */

// Clean TTS Route (to replace broken section)
export const cleanTTSRoute = `
  // Text-to-Speech with optimized processing
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceId, modelId, stability, similarityBoost, cartesiaModelId, speed, emotions, language } = ttsSchema.parse(req.body);
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          message: "Text cannot be empty",
          error: "EMPTY_TEXT"
        });
      }

      const cleanTextForSpeech = (text: string) => {
        return text
          .replace(/\\|/g, ' ')
          .replace(/---+/g, ' ')
          .replace(/#{1,6}\\s+/g, '')
          .replace(/\\*\\*(.*?)\\*\\*/g, '$1')
          .replace(/\\*(.*?)\\*/g, '$1')
          .replace(/\`(.*?)\`/g, '$1')
          .replace(/\\[(.*?)\\]\\(.*?\\)/g, '$1')
          .replace(/📊|📌|🎓|⏰|📞/g, '')
          .replace(/\\s+/g, ' ')
          .trim();
      };

      const detectLanguage = (text: string): 'hi' | 'en' => {
        const hindiWords = ['aap', 'hai', 'hain', 'kya', 'kaise', 'kahan', 'namaste', 'dhanyawad', 'main', 'hum', 'kar', 'karo', 'karna', 'kiya', 'ghar', 'paani', 'khana', 'college', 'student', 'teacher', 'library', 'hostel', 'fees', 'exam', 'result', 'madad', 'help', 'problem', 'achha', 'bura', 'naya', 'purana', 'bada', 'chota', 'se', 'ko', 'ke', 'ki', 'ka', 'me', 'mein', 'par', 'pe', 'tak', 'aur', 'ya', 'lekin', 'agar', 'to', 'phir', 'fir', 'kyun', 'kyon', 'kab', 'kon', 'kaun', 'kitna', 'kitni', 'kitne'];
        const lowerText = text.toLowerCase();
        const hindiWordCount = hindiWords.filter(word => lowerText.includes(word)).length;
        const totalWords = text.split(/\\s+/).length;
        return hindiWordCount / totalWords > 0.2 ? 'hi' : 'en';
      };

      // OPTIMIZATIONS APPLIED:
      const cleanedText = cleanTextForSpeech(text);
      const normalizedText = normalizeTextForTTS(cleanedText); // ✅ Text normalization
      const textChunks = splitTextIntoChunks(normalizedText, 900); // ✅ Improved chunking (900 chars)
      const detectedLanguage = detectLanguage(textChunks[0] || cleanedText);
      
      console.log('TTS: Text split into', textChunks.length, 'chunks');
      console.log('TTS: Detected language:', detectedLanguage);
      console.log('TTS: Starting optimized sequential processing...');
      
      // Sequential processing with optimizations
      const audioBuffers: Buffer[] = [];

      // Helper function with retry logic (exponential backoff)
      const processChunkWithRetry = async (chunk: string, chunkIndex: number, provider: 'elevenlabs' | 'cartesia'): Promise<Buffer | null> => {
        const maxRetries = 3;
        const baseDelay = 250;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(\`TTS: Processing chunk \${chunkIndex + 1}/\${textChunks.length} with \${provider} (attempt \${attempt + 1}): "\${chunk.substring(0, 50)}..."\`);
            
            if (provider === 'elevenlabs') {
              const requestBody = {
                text: chunk,
                model_id: modelId || "eleven_english_v2", // ✅ English model for consistency
                voice_settings: {
                  stability: stability || 0.9,  // ✅ Higher stability for consistency
                  similarity_boost: similarityBoost || 0.85, // ✅ Optimized settings
                  speed: 1.0
                }
              };
              
              const response = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
                method: 'POST',
                headers: {
                  'Accept': 'audio/mpeg',
                  'Content-Type': 'application/json',
                  'xi-api-key': elevenlabsApiKey
                },
                body: JSON.stringify(requestBody)
              });
              
              if (response.ok) {
                const audioBuffer = await response.arrayBuffer();
                console.log(\`TTS: Chunk \${chunkIndex + 1} ElevenLabs success! Audio size:\`, audioBuffer.byteLength, 'bytes');
                return Buffer.from(audioBuffer);
              } else {
                throw new Error(\`ElevenLabs API error: \${response.status}\`);
              }
            } else {
              // Cartesia processing with pronunciation corrections
              const correctedText = applyPronunciationCorrections(chunk);
              const cartesiaVoiceMapping = {
                "iWNf11sz1GrUE4ppxTOL": "fd2ada67-c2d9-4afe-b474-6386b87d8fc3",
              };
              const cartesiaVoiceId = cartesiaVoiceMapping[voiceId as keyof typeof cartesiaVoiceMapping] || "fd2ada67-c2d9-4afe-b474-6386b87d8fc3";
              const defaultEmotions = emotions && emotions.length > 0 ? emotions : ["positivity"];
              
              const requestBody = {
                model_id: cartesiaModelId || "sonic-2.0",
                transcript: correctedText,
                voice: {
                  mode: "id",
                  id: cartesiaVoiceId,
                  __experimental_controls: {
                    speed: speed || "normal",
                    emotion: defaultEmotions
                  }
                },
                output_format: {
                  container: "wav",
                  encoding: "pcm_s16le",
                  sample_rate: 44100
                },
                language: "hi"
              };
              
              const response = await fetch('https://api.cartesia.ai/tts/bytes', {
                method: 'POST',
                headers: {
                  'Authorization': \`Bearer \${cartesiaApiKey}\`,
                  'Cartesia-Version': '2025-04-16',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
              });
              
              if (response.ok) {
                const audioBuffer = await response.arrayBuffer();
                console.log(\`TTS: Chunk \${chunkIndex + 1} Cartesia success! Audio size:\`, audioBuffer.byteLength, 'bytes');
                return Buffer.from(audioBuffer);
              } else {
                throw new Error(\`Cartesia API error: \${response.status}\`);
              }
            }
            
          } catch (error) {
            if (attempt === maxRetries) {
              console.error(\`TTS: Chunk \${chunkIndex + 1} failed after \${maxRetries + 1} attempts:\`, error);
              return null;
            }
            
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(\`TTS: Chunk \${chunkIndex + 1} attempt \${attempt + 1} failed, retrying in \${delay}ms:\`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        return null;
      };
      
      // Try ElevenLabs first (single provider for consistency)
      const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
      if (elevenlabsApiKey && elevenlabsApiKey !== 'your_elevenlabs_api_key_here') {
        console.log('TTS: Attempting ElevenLabs for all chunks...');
        
        let allSuccessful = true;
        for (let i = 0; i < textChunks.length; i++) {
          const chunkAudio = await processChunkWithRetry(textChunks[i], i, 'elevenlabs');
          if (chunkAudio) {
            audioBuffers.push(chunkAudio);
          } else {
            allSuccessful = false;
            console.warn(\`TTS: Failed to process chunk \${i + 1}, stopping ElevenLabs processing\`);
            break;
          }
        }
        
        if (allSuccessful && audioBuffers.length === textChunks.length) {
          const finalAudio = Buffer.concat(audioBuffers);
          console.log(\`TTS: ElevenLabs completed! Combined \${audioBuffers.length} chunks, total audio size:\`, finalAudio.length, 'bytes');
          res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': finalAudio.length.toString(),
            'X-TTS-Provider': 'elevenlabs',
            'X-TTS-Chunks': textChunks.length.toString(),
            'X-TTS-Optimized': 'true'
          });
          return res.send(finalAudio);
        }
        
        console.log('TTS: ElevenLabs partial failure, trying Cartesia fallback...');
        audioBuffers.length = 0; // Clear failed attempts
      } else {
        console.log('TTS: ElevenLabs API key not configured, skipping...');
      }
      
      // Cartesia fallback (whole response, not mixed)
      const cartesiaApiKey = process.env.CARTESIA_API_KEY;
      if (cartesiaApiKey && cartesiaApiKey !== 'your_cartesia_api_key_here') {
        console.log('TTS: Attempting Cartesia fallback for all chunks...');
        
        let allSuccessful = true;
        for (let i = 0; i < textChunks.length; i++) {
          const chunkAudio = await processChunkWithRetry(textChunks[i], i, 'cartesia');
          if (chunkAudio) {
            audioBuffers.push(chunkAudio);
          } else {
            allSuccessful = false;
            console.warn(\`TTS: Failed to process chunk \${i + 1} with Cartesia\`);
            break;
          }
        }
        
        if (allSuccessful && audioBuffers.length === textChunks.length) {
          const finalAudio = Buffer.concat(audioBuffers);
          console.log(\`TTS: Cartesia completed! Combined \${audioBuffers.length} chunks, total audio size:\`, finalAudio.length, 'bytes');
          res.set({
            'Content-Type': 'audio/wav',
            'Content-Length': finalAudio.length.toString(),
            'X-TTS-Provider': 'cartesia',
            'X-TTS-Chunks': textChunks.length.toString(),
            'X-TTS-Optimized': 'true'
          });
          return res.send(finalAudio);
        }
      } else {
        console.log('TTS: Cartesia API key not configured, skipping...');
      }

      console.error('TTS: All providers failed');
      return res.status(503).json({
        message: "Speech synthesis unavailable - please check API configuration",
        error: "ALL_TTS_PROVIDERS_FAILED"
      });

    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      res.status(500).json({
        message: "Internal server error during speech generation",
        error: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
`;
