import { GoogleGenAI, type Content, type Part, GenerateImagesResponse } from "@google/genai";

import { getYouTubeTranscript } from "./youtube-transcript.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_INSTRUCTION = `
# CONTEXTO
Você é o "Analista Express", operando via API no WhatsApp. Seu objetivo é processar vídeos do YouTube e extrair respostas cirúrgicas. 
`;


const genAI = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

async function askAbout(question: string): Promise<string> {
  const youtubeUrlMatch = question.match(/(https?\:\/\/)?((www\.|m\.)?youtube\.com|youtu\.be)\/.+\n*/);
  const youtubeUrl = youtubeUrlMatch ? youtubeUrlMatch[0] : null;

  if (youtubeUrl) {
    return askAboutVideo(question, youtubeUrl);
  }

  return 'Não foi possível identificar um vídeo do YouTube na pergunta.';
}

async function askAboutVideo(question: string, youtubeUrl: string): Promise<string> {
  const parts: Part[] = [];

  parts.push({ text: `# DADOS DE ENTRADA\n[PERGUNTA DO USUÁRIO]: ${question}` });
  if (youtubeUrl && question.startsWith("Assista")) {
    console.log(`Utilizando fileUri para o vídeo: ${youtubeUrl}`);
    parts.push({
      fileData: {
        fileUri: youtubeUrl,
      },
    });
  } else {
    console.log(`Utilizando transcrição para vídeo: ${youtubeUrl}`);
    const transcript = await getYouTubeTranscript(youtubeUrl);
    console.log(`Transcrição: ${transcript.substring(0, 200)}...`);
    parts.push({ text: `[TRANSCRIÇÃO]: ${transcript}` });
  }

  const contents: Content[] = [
    {
      role: 'user',
      parts,
    },
  ];

  const response = await runPrompt(contents);

  return response.text ?? 'Não foi possível gerar uma resposta.';
}

async function runPrompt(contents: any[]): Promise<{ text: string }> {
  console.log("Generating response from Gemini...");
  const startTime = Date.now();
  try {
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    console.log("\n=== GEMINI ANSWER ===\n");
    console.log(response.text);
    console.log("\n========================");
    
    console.log("Gemini answer char count:", response.text?.length);
    console.log(`Execution time: ${Date.now() - startTime} ms`);
    return { text: response.text ?? 'Não foi possível gerar uma resposta.' };

  } catch (error) {
    console.error("Error prompting Gemini:", error);
    return { text: 'Não foi possível gerar uma resposta.' };
  }
}

export { askAbout }