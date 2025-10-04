import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { AnalysisResult, ExtractionMode } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    words: {
      type: Type.ARRAY,
      description: "An array of all words extracted from the image. Each word should be an object containing the text and its normalized bounding box.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The text content of the word."
          },
          boundingBox: {
            type: Type.OBJECT,
            description: "The normalized bounding box of the word, with coordinates from 0 to 1.",
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
            },
            required: ["x", "y", "width", "height"]
          }
        },
        required: ["text", "boundingBox"]
      }
    },
    identifiedFontName: {
      type: Type.STRING,
      description: `The specific name of the identified Arabic font (e.g., 'Sakkal Majalla'). If unknown, respond with 'Unknown'. If no Arabic text is detected, respond with 'N/A'.`,
    },
    identifiedFontStyle: {
      type: Type.STRING,
      description: "The general style of the identified font. Must be one of: 'Naskh', 'Ruqah', 'Diwani', 'Thuluth', 'Kufi', 'Farsi'. If no Arabic text is detected, respond with 'N/A'."
    },
    identifiedFontUrl: {
      type: Type.STRING,
      description: "A direct URL to download the identified font if a commercially-free version can be found online (e.g., from Google Fonts). If no such link is found, this should be null."
    },
    similarFonts: {
      type: Type.ARRAY,
      description: "A list of up to 3 similar, commercially-free Arabic fonts. First, search on arfonts.net, alfont.com, and arbfonts.com. If no results are found there, then search on Google Fonts and other major font repositories.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the similar font."
          },
          url: {
            type: Type.STRING,
            description: "The direct URL to the font's page."
          },
          source: {
            type: Type.STRING,
            description: "The source repository of the font, e.g., 'Arabic Fonts Archive', 'Google Fonts'."
          }
        },
        required: ["name", "url", "source"]
      }
    },
    designBrief: {
      type: Type.STRING,
      description: "A brief, creative summary (2-3 sentences) for a graphic designer. Analyze the text's tone (e.g., poetic, formal, corporate) and suggest potential visual themes, color palettes, or use cases. Write it in Arabic."
    }
  },
  required: ["words", "identifiedFontName", "identifiedFontStyle", "identifiedFontUrl", "similarFonts", "designBrief"]
};


export async function analyzeArabicFont(base64Image: string, mimeType: string, extractionModes: ExtractionMode[]): Promise<AnalysisResult> {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType
    }
  };

  let extractionInstruction: string;
  // Default to 'all' if empty or explicitly selected
  if (extractionModes.length === 0 || extractionModes.includes('all')) {
    extractionInstruction = 'Extract all text content found in the image.';
  } else {
    const partsToExtract: string[] = [];
    if (extractionModes.includes('arabic')) partsToExtract.push('Arabic script text');
    if (extractionModes.includes('foreign')) partsToExtract.push('non-Arabic text (e.g., English, Latin script)');
    if (extractionModes.includes('numbers')) partsToExtract.push('numerical digits');

    let instruction = `You MUST extract ${partsToExtract.join(' AND ')} ONLY.`;

    // Add explicit ignore instructions for more precise results
    if (!extractionModes.includes('numbers')) {
        instruction += ' You MUST ignore all numerical digits.';
    }
    if (!extractionModes.includes('arabic')) {
        instruction += ' You MUST ignore all Arabic script text.';
    }
    if (!extractionModes.includes('foreign')) {
        instruction += ' You MUST ignore all non-Arabic text.';
    }
    
    extractionInstruction = instruction;
  }
  
  const isFontAnalysisNeeded = extractionModes.length === 0 || extractionModes.includes('all') || extractionModes.includes('arabic');

  const textPart = {
    text: `Analyze the attached image. Perform detailed OCR to extract text word-by-word. For each word, provide its text content and a normalized bounding box (coordinates from 0 to 1 for x, y, width, height).
${extractionInstruction}

${isFontAnalysisNeeded ?
`If Arabic text is present, identify the specific name of the primary Arabic font used (e.g., 'Sakkal Majalla'). Also, classify its style into one of the following categories: Naskh, Ruqah, Diwani, Thuluth, Kufi, or Farsi.
Additionally, try to find a direct, commercially-free download link for the *identified font itself*. Prioritize sources like Google Fonts. If a link is found, provide it. If not, return null for the URL.
If no Arabic text is present, respond with 'N/A' for both the font name and font style, and null for the URL.
Then, if an Arabic font was identified, find up to 3 similar-looking, commercially-free Arabic fonts.
First, search exclusively on these websites:
- https://www.arfonts.net/
- https://alfont.com/
- https://arbfonts.com/
For any fonts found on these sites, set their source as 'Arabic Fonts Archive'.
If and only if you find NO results on the sites above, broaden your search to Google Fonts (fonts.google.com) and other major font repositories. For fonts found this way, set their source as 'Google Fonts' or the name of the repository.
Provide the name and a direct URL for each font. If the original font name cannot be identified, return 'Unknown' for 'identifiedFontName', but still provide the best-guess style for 'identifiedFontStyle'. If no similar fonts are found anywhere, provide an empty list.

Finally, based on the extracted text, provide a concise creative brief ('designBrief') for a graphic designer. This brief should be in Arabic, analyze the text's tone (e.g., poetic, formal, corporate), and suggest potential visual themes or use cases. It should be 2-3 sentences long.`
:
`Since Arabic text extraction was not requested, you MUST NOT perform font analysis. Set 'identifiedFontName' to 'N/A', 'identifiedFontStyle' to 'N/A', 'identifiedFontUrl' to null, 'similarFonts' to an empty array, and 'designBrief' to an empty string.`
}`
  };

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    // Handle cases where the API returns a response object but no text content.
    if (!response.text) {
        const blockReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;

        if (blockReason === 'SAFETY' || (safetyRatings && safetyRatings.some(r => r.blocked))) {
            throw new Error("Analysis blocked: The image may contain sensitive content. Please try a different image.");
        }
        if (blockReason) {
             throw new Error(`Analysis failed. Reason: ${blockReason}. Please try a different image or adjust settings.`);
        }
        
        throw new Error("The AI returned an empty response. This could be a temporary issue, please try again.");
    }

    // Attempt to parse the JSON response.
    try {
        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString) as AnalysisResult;
        
        if (parsedResult.identifiedFontName === 'N/A') {
            parsedResult.similarFonts = [];
        }

        return parsedResult;

    } catch (jsonError) {
        console.error("Failed to parse JSON response:", response.text, jsonError);
        throw new Error("The AI returned an invalid response format. This can happen with complex images. Please try again or use a clearer image.");
    }

  } catch (error) {
    console.error("Error during Gemini API call or processing:", error);
    
    if (error instanceof Error) {
        const errorMessage = error.message;

        // If it's one of our custom, user-friendly errors from within the try block, re-throw it directly.
        if (errorMessage.startsWith('Analysis blocked:') || errorMessage.startsWith('Analysis failed.') || errorMessage.startsWith('The AI returned')) {
             throw error;
        }

        // Otherwise, interpret common technical API errors into user-friendly messages.
        const lowerCaseMessage = errorMessage.toLowerCase();
        if (lowerCaseMessage.includes('invalid_argument') || lowerCaseMessage.includes('unable to process input image')) {
            throw new Error("The AI couldn't process this image. It might be corrupted or in an unsupported format. Please try re-saving the image or using a different one.");
        }
        if (lowerCaseMessage.includes('429') || lowerCaseMessage.includes('rate limit')) {
            throw new Error("The service is experiencing high traffic. Please wait a moment before trying again.");
        }
        if (lowerCaseMessage.includes('api key not valid')) {
             throw new Error("The API key is invalid. Please check the application configuration.");
        }
        if (lowerCaseMessage.includes('deadline_exceeded') || lowerCaseMessage.includes('timeout')) {
            throw new Error("The request took too long and timed out. This can happen with a slow connection or a very large image. Please try again.");
        }
    }

    // This is a default catch-all for any other unexpected errors.
    throw new Error("An unexpected error occurred during analysis. This could be a network issue or a problem with the AI service. Please check your connection and try again.");
  }
}

export function createChat(analysisResult: AnalysisResult): Chat {
  const extractedText = analysisResult.words.map(w => w.text).join(' ');
  const initialContext = `
    The user has uploaded an image and received the following analysis:
    - Identified Font Style: ${analysisResult.identifiedFontStyle}
    - Identified Font Name: ${analysisResult.identifiedFontName}
    - Extracted Text: "${extractedText}"
    - AI Creative Brief: "${analysisResult.designBrief}"
  `;

  const chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a helpful and creative AI assistant for graphic designers, named 'الحُس الذكي'. Your purpose is to help the user with ideas based on the text and font analysis from their image. Your responses must be in Arabic. Start the conversation by introducing yourself and asking how you can help with their design.
      ${initialContext}`,
    },
  });

  return chatSession;
}
