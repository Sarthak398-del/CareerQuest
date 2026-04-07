import { GoogleGenAI } from "@google/genai";

// Use VITE_ prefix for Vercel/Vite environment variables, fallback to process.env for local/AI Studio
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function getExamData() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide detailed information for top Indian entrance exams (JEE Main, NEET, CLAT, CAT, UPSC CSE, NDA, GATE, NIFT, NID, CUET). For each exam, include: name, category, eligibility, subjects, pattern, difficulty, outcome, strategy, key dates (2025-2026), syllabus highlights (as array), and official website. Format as a JSON array of objects matching the Exam interface.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log(response.text);
}

async function getCareerData() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide detailed career information for: Politician, Small Business Owner, Government Clerk, Bank PO, SSC CGL Officer, Lawyer, Corporate Lawyer, Startup Founder, Business Analyst, Marketing Manager. For each, include: id, title, category, description, skills (array), salary, scope, exams (array of exam IDs), pathway (array of steps), responsibilities (array), and outlook. Format as a JSON array of objects matching the Career interface.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log(response.text);
}

getExamData();
getCareerData();
