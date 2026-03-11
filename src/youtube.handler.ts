import { fetchTranscript, type TranscriptResponse } from 'youtube-transcript-plus';

import type { MessageHandler, MessageContext } from './handler.interface.js';
import { runPrompt } from './genai.js';

const YT_URL_REGEX = /(https?\:\/\/)?((www\.|m\.)?youtube\.com|youtu\.be)\/.+/;

const YT_SYSTEM_PROMPT = `
# PAPEL
Você é um assistente especializado em analisar conteúdos (vídeos ou transcrições) e fornecer respostas precisas, rápidas e formatadas para leitura em smartphones.

# REGRAS DE COMPORTAMENTO
1. DIRETO AO PONTO: Inicie a resposta com a informação principal. Não utilize saudações, despedidas ou frases introdutórias (ex: "Aqui está", "Baseado no vídeo").
2. TOLERÂNCIA A ERROS MÍNIMOS: Transcrições geradas por IA contêm falhas (gagueiras, repetições, erros de grafia). Ignore a sintaxe falha e concentre-se em extrair o significado central.
3. CONFIABILIDADE (ANTI-ALUCINAÇÃO): Baseie sua resposta APENAS no conteúdo fornecido. Se a resposta para a pergunta não estiver presente ou não puder ser inferida com total segurança, responda exclusivamente: "Essa informação não está disponível neste conteúdo."

# REGRAS DE FORMATAÇÃO (ESTILO MENSAGEM CURTA)
- Destaque termos cruciais, métricas, datas ou conclusões usando *negrito*.
- Maximize a legibilidade: use tópicos (bullet points) se houver múltiplas informações.
- Seja extremamente conciso. Mantenha a resposta entre poucas palavras até 777 caracteres sempre que possível.

# TAREFA
Analise o conteúdo a seguir e responda à pergunta do usuário aplicando estritamente todas as regras acima.
`

async function getYouTubeTranscript(url: string): Promise<string> {
    try {
        const transcript: TranscriptResponse[] = await fetchTranscript(url);
        const text = transcript
            .map((item) => item.text)
            .join(' ');

        return text;
    } catch (err: any) {
        console.error("Erro ao obter transcrição:", err.message || err);
        return "";
    }
}

export class YoutubeHandler implements MessageHandler {

  canHandle(ctx: MessageContext): boolean {
    return YT_URL_REGEX.test(ctx.rawText);
  }

  async handle(ctx: MessageContext): Promise<string> {
    const url = ctx.rawText.match(YT_URL_REGEX)![0];

    const transcript = await getYouTubeTranscript(url);

    const contents = [{
      role: 'user',
      parts: [
        { text: `[PERGUNTA]: ${ctx.rawText}` },
        { text: `[TRANSCRIÇÃO]: ${transcript}` },
      ],
    }];

    const response = await runPrompt(contents, YT_SYSTEM_PROMPT);
    return response.text ?? 'Não foi possível gerar uma resposta.';
  }

}
