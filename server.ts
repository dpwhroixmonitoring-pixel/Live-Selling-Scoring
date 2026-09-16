import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // Support audio base64 payloads up to 35MB
  app.use(express.json({ limit: "35mb" }));
  app.use(express.urlencoded({ extended: true, limit: "35mb" }));

  // API: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API: Evaluate student audio presentation
  app.post("/api/evaluate-audio", async (req, res) => {
    try {
      const { studentName, activity, audioBase64, mimeType, durationSeconds } = req.body;

      if (!audioBase64) {
        return res.status(400).json({
          error: "Missing audio recording data. Please record your presentation first.",
        });
      }

      const cleanStudentName = (studentName || "Student").trim();
      const cleanActivity = (activity || "Audio Presentation").trim();

      // Normalize MIME type (strip codecs info if present, e.g. 'audio/webm;codecs=opus' -> 'audio/webm')
      let normalizedMimeType = mimeType || "audio/webm";
      if (normalizedMimeType.includes(";")) {
        normalizedMimeType = normalizedMimeType.split(";")[0].trim();
      }

      const ai = getGeminiClient();

      const evaluationPrompt = `
You are an expert educational speech and presentation evaluator.
EVALUATION PHILOSOPHY: The primary basis of the score MUST be the CONTENT OF THE STUDENT'S SPOKEN PRESENTATION.
The student's actual spoken words must be the main evidence used for scoring.
Content must account for 90% of the total score. Delivery must account for only 10%.

Student Name: ${cleanStudentName}
Activity / Topic: ${cleanActivity}
Recorded Duration: ${durationSeconds ? Math.round(durationSeconds) + " seconds" : "Audio presentation"}

STRICT FAIRNESS RULES:
- Do NOT primarily score the student based on: microphone quality, recording quality, loudness, background noise, accent, attractiveness of voice, gender, age, appearance, audience size, or audience reaction.
- Do NOT let accent alone reduce the score.
- The AI must NOT give a high score simply because the student's voice sounds pleasant.
- A student with excellent content but an ordinary voice should receive a high score.
- A student with an impressive-sounding voice but weak or inaccurate content should NOT receive a high score.

ANALYSIS PROCESS:
1. Analyze the audio and transcribe the student's actual spoken words verbatim into "transcript".
2. Identify the main topic, product, or service.
3. Identify the student's main claims, arguments, features, and benefits mentioned.
4. Identify persuasive techniques and presentation structure.
5. If the recording is silent, contains only static/noise, or contains insufficient understandable speech (e.g., under 3-4 audible words):
   - Set all category scores to 0 and total to 0.
   - transcript: "(No intelligible speech detected in recording)"
   - feedback: "Your recording does not contain enough understandable speech for reliable scoring. Please record again."
   - keyObservations: all set to "Insufficient speech detected to evaluate."
6. If understandable speech is present, score according to the following exact rubric:

RUBRIC CRITERIA (TOTAL = 100 POINTS):

1. CONTENT AND PRODUCT KNOWLEDGE — 30 POINTS (Max: 30)
Evaluate whether the student clearly identifies the product/service/topic, explains relevant features, explains benefits, demonstrates understanding, provides useful/relevant information, and avoids unsupported/incorrect claims.
- 30–27: Excellent and detailed content. Demonstrates strong understanding.
- 26–23: Very good content with minor missing information.
- 22–18: Adequate content but several important details are missing.
- 17–12: Limited content and weak understanding.
- 11–0: Very little relevant information or major inaccuracies.

2. PERSUASIVENESS — 25 POINTS (Max: 25)
Evaluate whether the student gives clear reasons to consider the product/service, explains benefits to potential customers, uses convincing arguments, addresses possible customer needs or problems, gives clear reasons to accept the offer, and uses appropriate persuasive language.
- 25–23: Highly persuasive and supported by strong reasons.
- 22–19: Generally persuasive with good supporting points.
- 18–15: Some persuasive elements but arguments are limited.
- 14–10: Weak persuasion.
- 9–0: Little or no persuasive content.

3. ORGANIZATION AND COMPLETENESS — 20 POINTS (Max: 20)
Evaluate whether the presentation has a clear introduction, logical sequence of ideas, understandable explanation, relevant supporting information, and clear conclusion or call to action.
- 20–18: Very well organized and complete.
- 17–15: Generally organized with minor gaps.
- 14–11: Some organization but several gaps.
- 10–6: Poor organization.
- 5–0: Very difficult to follow or incomplete.

4. AUDIENCE ENGAGEMENT THROUGH SPOKEN CONTENT — 15 POINTS (Max: 15)
Evaluate engagement based ONLY on what can reasonably be determined from spoken words: questions directed toward audience, relatable examples, customer-focused language, attention-getting opening, storytelling, and clear calls to action. (Do NOT assume actual audience reaction).
- 15–14: Strong audience-oriented content.
- 13–11: Good audience engagement techniques.
- 10–8: Some audience-oriented elements.
- 7–4: Limited engagement.
- 3–0: Little evidence of audience-oriented content.

5. DELIVERY AND FLUENCY — 10 POINTS (Max: 10)
Evaluates how effectively the student communicates the content through speech (fluency, understandable speech, appropriate pacing and emphasis, minimal hesitation). Do NOT let accent alone reduce the score.
- 10–9: Clear and fluent delivery.
- 8–7: Generally fluent with minor issues.
- 6–5: Some noticeable delivery problems.
- 4–2: Frequent delivery problems.
- 1–0: Delivery significantly interferes with understanding.

KEY CONTENT OBSERVATIONS:
- explainedWell: 1-2 specific sentences noting what the student explained well.
- infoIncluded: 1-2 specific sentences identifying important information and details included.
- missingInfo: 1-2 specific sentences noting missing or weak information that should have been covered.
- persuasiveStrength: 1-2 specific sentences assessing the strength and effectiveness of the student's persuasive argument.

AI FEEDBACK:
Provide 3–5 concise, actionable sentences explaining specifically how the student can improve the actual CONTENT and persuasive strength of the presentation.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            inlineData: {
              mimeType: normalizedMimeType,
              data: audioBase64,
            },
          },
          {
            text: evaluationPrompt,
          },
        ],
        config: {
          systemInstruction:
            "You are a professional educational speech and presentation evaluator. Evaluate the student's actual spoken presentation based primarily on CONTENT (90%) and delivery (10%). Always transcribe the student's speech and return strict structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.STRING,
                description: "Verbatim transcription of the student's spoken presentation.",
              },
              contentKnowledge: {
                type: Type.INTEGER,
                description: "Score 0 to 30 for Content and Product Knowledge.",
              },
              persuasiveness: {
                type: Type.INTEGER,
                description: "Score 0 to 25 for Persuasiveness.",
              },
              organization: {
                type: Type.INTEGER,
                description: "Score 0 to 20 for Organization and Completeness.",
              },
              audienceEngagement: {
                type: Type.INTEGER,
                description: "Score 0 to 15 for Audience Engagement Through Spoken Content.",
              },
              deliveryFluency: {
                type: Type.INTEGER,
                description: "Score 0 to 10 for Delivery and Fluency.",
              },
              total: {
                type: Type.INTEGER,
                description: "Total score (0-100), sum of the 5 criteria.",
              },
              keyObservations: {
                type: Type.OBJECT,
                properties: {
                  explainedWell: {
                    type: Type.STRING,
                    description: "What the student explained well.",
                  },
                  infoIncluded: {
                    type: Type.STRING,
                    description: "Important information included.",
                  },
                  missingInfo: {
                    type: Type.STRING,
                    description: "Missing or weak information.",
                  },
                  persuasiveStrength: {
                    type: Type.STRING,
                    description: "Strength of the student's persuasive argument.",
                  },
                },
                required: ["explainedWell", "infoIncluded", "missingInfo", "persuasiveStrength"],
              },
              feedback: {
                type: Type.STRING,
                description: "3-5 concise sentences explaining how the student can improve the actual content.",
              },
            },
            required: [
              "transcript",
              "contentKnowledge",
              "persuasiveness",
              "organization",
              "audienceEngagement",
              "deliveryFluency",
              "total",
              "keyObservations",
              "feedback",
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No evaluation data received from AI model.");
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Failed to parse AI evaluation response as JSON.");
      }

      // Strictly clamp categories within designated rubric maximums
      const clampScore = (val: any, max: number): number => {
        const n = typeof val === "number" ? val : parseInt(val, 10);
        if (isNaN(n) || n < 0) return 0;
        if (n > max) return max;
        return Math.round(n);
      };

      const contentKnowledge = clampScore(parsedData.contentKnowledge, 30);
      const persuasiveness = clampScore(parsedData.persuasiveness, 25);
      const organization = clampScore(parsedData.organization, 20);
      const audienceEngagement = clampScore(parsedData.audienceEngagement, 15);
      const deliveryFluency = clampScore(parsedData.deliveryFluency, 10);

      // Total must always strictly equal the sum of the 5 criteria
      const total = Math.min(
        100,
        Math.max(
          0,
          contentKnowledge + persuasiveness + organization + audienceEngagement + deliveryFluency
        )
      );

      const transcript =
        typeof parsedData.transcript === "string" && parsedData.transcript.trim().length > 0
          ? parsedData.transcript.trim()
          : "(No intelligible speech detected)";

      const keyObservations = {
        explainedWell:
          parsedData.keyObservations?.explainedWell || "Topic introduced clearly.",
        infoIncluded:
          parsedData.keyObservations?.infoIncluded || "Key features described.",
        missingInfo:
          parsedData.keyObservations?.missingInfo || "Additional supporting evidence recommended.",
        persuasiveStrength:
          parsedData.keyObservations?.persuasiveStrength || "Arguments delivered to audience.",
      };

      const feedback =
        typeof parsedData.feedback === "string" && parsedData.feedback.trim().length > 0
          ? parsedData.feedback.trim()
          : "Evaluation completed.";

      // Check if audio was detected as silent, unintelligible, or insufficient
      const isInsufficientAudio =
        total === 0 ||
        (contentKnowledge === 0 &&
          persuasiveness === 0 &&
          organization === 0 &&
          audienceEngagement === 0 &&
          deliveryFluency === 0) ||
        transcript.toLowerCase().includes("no intelligible speech");

      const resultPayload = {
        studentName: cleanStudentName,
        activity: cleanActivity,
        contentKnowledge,
        persuasiveness,
        organization,
        audienceEngagement,
        deliveryFluency,
        total,
        totalScore: total,
        keyObservations,
        feedback,
        aiFeedback: feedback,
        transcript,
        isInsufficientAudio,
        evaluatedAt: new Date().toISOString(),
      };

      return res.json(resultPayload);
    } catch (err: any) {
      console.error("Evaluation error:", err);
      return res.status(500).json({
        error: "We could not analyze your recording. Please try again.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Audio Scorer server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
