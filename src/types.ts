export interface KeyContentObservations {
  explainedWell: string;
  infoIncluded: string;
  missingInfo: string;
  persuasiveStrength: string;
}

export interface AudioScoreResult {
  studentName: string;
  activity: string;
  // Content-based scoring criteria (90% content + 10% delivery = 100 total)
  contentKnowledge: number; // 0-30
  persuasiveness: number; // 0-25
  organization: number; // 0-20
  audienceEngagement: number; // 0-15
  deliveryFluency: number; // 0-10
  total: number; // 0-100, strictly sum of the 5 criteria
  totalScore?: number;
  keyObservations: KeyContentObservations;
  feedback: string; // 3-5 concise sentences on how to improve actual content
  aiFeedback?: string;
  transcript: string; // Transcription of student's spoken presentation
  isInsufficientAudio?: boolean;
  evaluatedAt: string;
}

export interface EvaluationPayload {
  studentName: string;
  activity: string;
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
}

