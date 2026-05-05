/**
 * Text Chunking Utility for ElevenLabs TTS
 * Splits text into safe chunks for TTS processing
 */

/**
 * Split text into safe chunks for ElevenLabs TTS - IMPROVED VERSION
 * Uses larger chunks (700-1200 chars) and prefers paragraph/sentence boundaries
 * @param text - The text to split
 * @param maxChunkSize - Maximum characters per chunk (default: 900)
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number = 900): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // 1) Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // 2) Split by paragraph if any \n\n exist
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= maxChunkSize) {
      // Check if we can merge with previous chunk
      if (chunks.length && (chunks[chunks.length - 1].length + para.length + 1) <= maxChunkSize) {
        chunks[chunks.length - 1] += ' ' + para;
      } else {
        chunks.push(para);
      }
    } else {
      // Paragraph too large - split by sentences
      const sentences = para.match(/[^.!?]+[.!?]*/g) || [para];
      let current = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        const combined = (current + ' ' + trimmedSentence).trim();
        
        if (combined.length > maxChunkSize) {
          // Current chunk is full, save it and start new
          if (current) {
            chunks.push(current.trim());
            current = trimmedSentence;
          } else {
            // Single sentence exceeds max - force split at word boundaries
            let start = 0;
            while (start < trimmedSentence.length) {
              let end = Math.min(start + maxChunkSize, trimmedSentence.length);
              
              // Find last space within limit to avoid breaking words
              if (end < trimmedSentence.length) {
                const lastSpace = trimmedSentence.lastIndexOf(' ', end);
                if (lastSpace > start) {
                  end = lastSpace;
                }
              }
              
              const chunk = trimmedSentence.slice(start, end).trim();
              if (chunk.length > 0) {
                chunks.push(chunk);
              }
              start = end;
              
              // Skip leading whitespace for next chunk
              while (start < trimmedSentence.length && trimmedSentence[start] === ' ') {
                start++;
              }
            }
            current = '';
          }
        } else {
          current = combined;
        }
      }
      
      // Add remaining content
      if (current.trim()) {
        chunks.push(current.trim());
      }
    }
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Example usage and testing
 */
export function testTextChunker() {
  const testText = "India got freedom in 1947. The country grew rapidly after independence. Today it is a major economy.";
  const chunks = splitTextIntoChunks(testText);
  console.log('Text chunks:', chunks);
  return chunks;
}
