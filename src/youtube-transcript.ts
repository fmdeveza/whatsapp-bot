import { fetchTranscript, type TranscriptResponse } from 'youtube-transcript-plus';

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

export { getYouTubeTranscript };