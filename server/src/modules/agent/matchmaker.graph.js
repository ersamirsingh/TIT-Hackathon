import { StateGraph, Annotation } from "@langchain/langgraph";
import { model, embeddings } from "./gemini.config.js";

// Helper to compute cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// 1. Define the LangGraph State Annotation
const MatchmakerState = Annotation.Root({
  job: Annotation,
  worker: Annotation,
  skillsSimilarity: Annotation,
  reputationScore: Annotation,
  overallScore: Annotation,
  reasoning: Annotation,
});

// 2. Node: Calculate Semantic Skills Similarity
const calculateSimilarityNode = async (state) => {
  const { job, worker } = state;
  try {
    const jobText = `
      Title: ${job.title || ""}
      Category: ${job.category || ""}
      Description: ${job.description || ""}
      Required Skills: ${(job.skills || []).join(", ")}
    `.trim();

    const workerText = `
      Name: ${worker.Name || ""}
      Headline: ${worker.workerProfile?.headline || ""}
      About: ${worker.workerProfile?.about || ""}
      Categories: ${(worker.workerProfile?.categories || []).join(", ")}
    `.trim();

    // Generate embeddings
    const [jobEmbed, workerEmbed] = await Promise.all([
      embeddings.embedQuery(jobText),
      embeddings.embedQuery(workerText),
    ]);

    const similarity = cosineSimilarity(jobEmbed, workerEmbed);
    
    // Scale similarity (which is usually between 0.5 and 1.0 for matching contexts) to a 0-100 scale
    const percentage = Math.round(Math.max(0, (similarity - 0.3) / 0.7) * 100);

    return { skillsSimilarity: Math.min(100, Math.max(0, percentage)) };
  } catch (error) {
    console.error("Similarity node error:", error.message);
    return { skillsSimilarity: 60 }; // fallback
  }
};

// 3. Node: Evaluate Reputation and Experience
const evaluateReputationNode = async (state) => {
  const { worker } = state;
  try {
    const baseRating = worker.rating || 4.0;
    // Map rating (1-5) to 0-100 scale
    let repScore = Math.round(((baseRating - 1) / 4) * 100);

    // Apply bonuses
    if (worker.workerProfile?.isVerifiedPro) {
      repScore += 5; // Verified Pro boost
    }
    if (worker.verified) {
      repScore += 5; // Government ID verified boost
    }
    if (worker.workerProfile?.totalJobsCompleted > 10) {
      repScore += 3;
    }

    return { reputationScore: Math.min(100, Math.max(0, repScore)) };
  } catch (error) {
    console.error("Reputation node error:", error.message);
    return { reputationScore: 70 };
  }
};

// 4. Node: Aggregate match score and generate custom reasoning
const aggregateMatchNode = async (state) => {
  const { job, worker, skillsSimilarity, reputationScore } = state;
  try {
    // 70% weight on skills semantic match, 30% on reputation
    const overallScore = Math.round(skillsSimilarity * 0.7 + reputationScore * 0.3);

    const prompt = `
      You are the Work-Link AI Matchmaking Assistant. 
      Analyze the matching metrics between the Job and the Worker:
      
      Job:
      - Title: "${job.title}"
      - Category: "${job.category}"
      - Description: "${job.description}"
      - Skills Required: "${(job.skills || []).join(", ")}"

      Worker:
      - Name: "${worker.Name}"
      - Headline: "${worker.workerProfile?.headline || "General Provider"}"
      - About: "${worker.workerProfile?.about || ""}"
      
      Calculated AI Match Details:
      - Semantic Skills Match: ${skillsSimilarity}%
      - Worker Reputation Score: ${reputationScore}%
      - Overall Match Recommendation: ${overallScore}%

      Write a short, friendly 1-2 sentence explanation for the customer.
      Explain why this worker is a good fit (or if there is a gap) based on their skills and ratings.
      Keep it direct, engaging, and professional. Do not exceed 40 words.
    `;

    const response = await model.invoke(prompt);
    const reasoning = response.content.trim();

    return { overallScore, reasoning };
  } catch (error) {
    console.error("Aggregation node error:", error.message);
    return { 
      overallScore: 75, 
      reasoning: `${worker.Name} has a rating of ${worker.rating || "4.0"} and works in related categories.` 
    };
  }
};

// 5. Assemble the LangGraph
const workflow = new StateGraph(MatchmakerState)
  .addNode("calculateSimilarity", calculateSimilarityNode)
  .addNode("evaluateReputation", evaluateReputationNode)
  .addNode("aggregateMatch", aggregateMatchNode)
  .addEdge("__start__", "calculateSimilarity")
  .addEdge("calculateSimilarity", "evaluateReputation")
  .addEdge("evaluateReputation", "aggregateMatch")
  .addEdge("aggregateMatch", "__end__");

export const matchmakerApp = workflow.compile();
