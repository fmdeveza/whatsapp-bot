import { GoogleGenAI, type Content, type Part, GenerateImagesResponse } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_INSTRUCTION = `
# CONTEXTO
Você é o "Analista Express", operando via API no WhatsApp. Seu objetivo é processar vídeos do YouTube e extrair respostas cirúrgicas. 

# STRICT RULES
1. SEM SAUDAÇÕES: Comece a resposta imediatamente com a informação solicitada. Proibido usar: "De acordo com o vídeo", "Baseado na análise", "Olá" ou "Entendi".
2. FILTRO DE RUÍDO: Se a transcrição for fornecida, ela é bruta (gerada por IA). Ignore repetições de palavras, gagueiras ou erros de fonética. Extraia o sentido lógico.
3. FIDELIDADE ABSOLUTA: Se a resposta não estiver explicitamente ou não puder ser inferida com 100% de certeza, responda apenas que não encontrou essa informação no conteúdo. Proibido inventar ou alucinar respostas.
4. WHATSAPP UI: 
   - Use *negrito* para dados cruciais (valores, nomes, datas, conclusões).
   - Use poucos parágrafos ou bullet points para sintetizar informações.
   - Limite sugerido: 500 caracteres.

# TAREFA
Analise video ou [TRANSCRIÇÃO] focando apenas na [PERGUNTA DO USUÁRIO] e gere o output seguindo as regras acima.

`;


const genAI = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

export async function askAbout(question: string): Promise<string> {
  const youtubeUrlMatch = question.match(/(https?\:\/\/)?((www\.|m\.)?youtube\.com|youtu\.be)\/.+\n*/);
  const youtubeUrl = youtubeUrlMatch ? youtubeUrlMatch[0] : null;

  if (youtubeUrl) {
    return askAboutVideo(question, youtubeUrl);
  }

  return 'Não foi possível identificar um vídeo do YouTube na pergunta.';
}

async function askAboutVideo(question: string, youtubeUrl: string): Promise<string> {
  const parts: Part[] = [];
  parts.push({ text: `# DADOS DE ENTRADA\n\n[PERGUNTA DO USUÁRIO]: ${question}\n` });
  if (youtubeUrl && question.startsWith("Assista")) {
    console.log(`Utilizando fileUri para o vídeo: ${youtubeUrl}`);
    parts.push({
      fileData: {
        fileUri: youtubeUrl,
      },
    });
  } else {
    console.log(`Utilizando transcrição para vídeo: ${youtubeUrl}`);
    // const transcript = await getYouTubeTranscript(youtubeUrl);
    // console.log(`Transcrição: ${transcript.substring(0, 200)}...`);
    // parts.push({ text: `[TRANSCRIÇÃO]: ${transcript}` });
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

function debugPrompt(contents: Content[]) {
  const fullTrim = (str: string) => str.trim().replace(/^[ \t]+/gm, '').replace(/ +/g, ' ');
  console.log("\n=== FULL PROMPT DEBUG ===\n");
  console.log(`[SYSTEM INSTRUCTION]\n${SYSTEM_INSTRUCTION.trim()}\n`);
  contents.forEach((content, i) => {
    // console.log(`\n[MESSAGE ${i + 1}] role: ${content.role}`);
    (content.parts as Part[]).forEach((part, j) => {
      if ('text' in part) {
        const preview = part.text!.length > 300 ? part.text!.substring(0, 300) + `... (+${part.text!.length - 300} chars)` : part.text;
        // console.log(`  [PART ${j + 1}] text: ${fullTrim(preview)}`);
        console.log(preview);
      } else if ('fileData' in part) {
        // console.log(`  [PART ${j + 1}] fileData: ${part.fileData?.fileUri}`);
        console.log(`fileData: ${part.fileData?.fileUri}`);
      } else {
        console.log(`  [PART ${j + 1}]`, part);
      }
    });
  });
  console.log("\n========================");
}

export { askAbout }