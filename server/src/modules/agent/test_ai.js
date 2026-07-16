import { configDotenv } from "dotenv";
configDotenv();

import { diagnoseJob } from "./ai.controller.js";

const runTest = async () => {
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY found in .env file. Skipping live execution check.");
    console.log("To run this test, add GEMINI_API_KEY=your_key in server/.env and run: node src/modules/agent/test_ai.js");
    return;
  }

  console.log("Contacting Gemini via LangChain for diagnosis...");
  const req = {
    body: {
      description: "My ceiling fan in the master bedroom has stopped spinning, and there is a burning plastic smell when I switch it on. I need a technician to inspect and fix it."
    }
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log("\n====== AI DIAGNOSE RESPONSE ======");
      console.log("HTTP Status:", this.statusCode);
      console.log(JSON.stringify(data, null, 2));
      console.log("==================================\n");
    }
  };

  await diagnoseJob(req, res);
};

runTest().catch((error) => {
  console.error("Test execution failed:", error);
});
