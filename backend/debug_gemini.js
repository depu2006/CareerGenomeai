require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function debugGemini() {
    try {
        console.log("Debug: Listing models implementation...");
        // The SDK doesn't have a direct listModels method on the client instance in older versions, 
        // but let's check if we can make a raw request or just try a different model.

        // Actually, let's just try to print the API key (partially) to be sure.
        const key = process.env.GEMINI_API_KEY;
        console.log("API Key loaded:", key ? key.substring(0, 5) + "..." : "Not found");

        const genAI = new GoogleGenerativeAI(key);

        // Try gemini-pro as a fallback
        console.log("Attempting generation with gemini-2.0-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent("Test");
            console.log("gemini-2.0-flash Success:", result.response.text());
        } catch (e) {
            console.log("gemini-2.0-flash Failed:", e.message);
        }

        console.log("Attempting generation with gemini-1.5-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Test");
            console.log("gemini-1.5-flash Success:", result.response.text());
        } catch (e) {
            console.log("gemini-1.5-flash Failed:", e.message);
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

debugGemini();
