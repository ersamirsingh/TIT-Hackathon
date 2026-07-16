import Job from "../../models/job.model.js";
import User from "../../models/user.model.js";
import { model } from "./gemini.config.js";
import { matchmakerApp } from "./matchmaker.graph.js";

/**
 * AI Diagnose & Autofill
 * Takes a problem description and returns structured parameters for creating a job.
 */
export const diagnoseJob = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim() === "") {
      return res.status(400).json({ success: false, message: "Description is required" });
    }

    const prompt = `
      Analyze this household problem description: "${description}"
      
      Extract and structure the following details into a JSON object:
      1. "title": A concise, clear, and professional job title.
      2. "category": Select the most appropriate category from: ["General", "Electrical", "Plumbing", "Painting", "Cleaning", "Appliance", "Carpentry", "Other"].
      3. "skills": An array of 2-4 key skills needed to resolve the issue (e.g. ["wiring", "soldering", "ac-maintenance"]).
      4. "pricingModel": Select either "standard" if it matches one of our standard services, or "inspection" if it's a diagnostic/complex job.
      5. "serviceCode": If pricingModel is "standard", select the code that matches best. Select empty string "" if it's "inspection" or doesn't match:
         - "fan-installation" (Electrical)
         - "switchboard-repair" (Electrical)
         - "tap-replacement" (Plumbing)
         - "pipe-leak-fix" (Plumbing)
         - "ac-service-basic" (Appliance)
         - "deep-cleaning-room" (Cleaning)
         - "door-lock-repair" (Carpentry)
      6. "safetyInstructions": A short 1-sentence tip or safety precaution for the customer while they wait for help.

      Return ONLY the JSON string. Do not include markdown code block backticks (like \`\`\`json).
    `;

    const response = await model.invoke(prompt);
    let parsedData;
    try {
      let cleanedText = response.content.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.substring(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      parsedData = JSON.parse(cleanedText.trim());
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", response.content);
      // Fallback response
      parsedData = {
        title: "Home Repair Request",
        category: "General",
        skills: ["inspection"],
        pricingModel: "inspection",
        serviceCode: "",
        safetyInstructions: "Stay clear of the affected area."
      };
    }

    return res.status(200).json({ success: true, diagnosis: parsedData });
  } catch (error) {
    console.error("diagnoseJob error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI Worker Matching
 * Invokes the LangGraph state graph workflow to evaluate match compatibility.
 */
export const matchWorker = async (req, res) => {
  try {
    const { jobId, workerId } = req.body;
    if (!jobId || !workerId) {
      return res.status(400).json({ success: false, message: "jobId and workerId are required" });
    }

    const [job, worker] = await Promise.all([
      Job.findById(jobId),
      User.findById(workerId),
    ]);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    // Invoke the LangGraph workflow
    const result = await matchmakerApp.invoke({ job, worker });

    return res.status(200).json({
      success: true,
      matchScore: result.overallScore,
      reasoning: result.reasoning,
    });
  } catch (error) {
    console.error("matchWorker error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
