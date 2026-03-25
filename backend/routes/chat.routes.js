import express from "express";
import { authMiddelware } from "../middelware/authMiddelware.js";
import { pubClient } from "../config/redis.js";
import { ai } from "../config/google.js";
import Alert from "../models/alert.model.js";

const chatRouter = express.Router();

chatRouter.post("/chat", authMiddelware, async (req, res) => {
  try {
    const userId = req.user._id;

    const { message, history, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({
        message: "UserId and DeviceId are required",
        success: false,
      });
    }

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
        success: false,
      });
    }
    let key = `userId:${userId}:deviceId:${deviceId}`;

    console.log(key);

    const cached = await pubClient.get(key);

    let parsed;

    if (cached) {
      parsed = JSON.parse(cached);
    }

    let latest = parsed.metric[parsed.metric.length - 1];

    let alerts = await Alert.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(10);

    const chat = ai.chats.create({
      model: "gemini-2.5-flash-lite",
      history: history || [],

      config: {
        systemInstruction: `
You are a solar microgrid diagnostic assistant with deep domain expertise.

INPUT:
- latest: most recent sensor reading
- history: last N sensor readings
- Warnings: warning from rule based engine for readings
- question: user's question

YOUR GOAL:
Answer the user's question accurately using sensor data + solar domain knowledge together.

═══════════════════════════════════════
CORE ANALYSIS RULES
═══════════════════════════════════════

1. HEALTH SCORE BREAKDOWN (always explain using sub-factors):
   Health score is derived from:
   - performance_ratio = actual_power / expected_power  (higher = better generation)
   - trust_score       (0–1 scale, reliability of readings)
   - battery_level     (% state of charge)
   - connectivity      (% uptime / signal)

   If health_score < 50 (poor), identify WHICH sub-factor(s) are dragging it down.
   Example: "Health is poor because battery is at 30% and connectivity dropped to 60%,
   even though power output is strong."

2. POWER > EXPECTED — EXPLAIN THE REASON (critical fix):
   When actual_power > expected_power, use this reasoning chain:
   a. Check time-of-day pattern in history → midday peak causes spikes
   b. Check if expected_power is a fixed baseline (may be under-calibrated)
   c. Check trust_score → if high (>0.85), readings are reliable, not sensor noise
   d. Infer: clear sky conditions, optimal sun angle, or clean panels
   e. State whether this is SAFE (brief surpluses are normal and not damaging)
      unless power exceeds 2× expected consistently — then flag for review.

3. EQUIPMENT SAFETY ASSESSMENT:
   If user asks about equipment damage from high output:
   - Safe zone: actual_power up to ~150% of expected_power → normal operating surplus
   - Caution zone: actual_power > 200% of expected_power sustained → flag for inspection
   - Always mention: solar panels are designed to handle generation variability;
     inverters and charge controllers regulate excess to protect equipment.

4. TREND ANALYSIS:
   Use history array to detect:
   - increasing / decreasing / stable / volatile
   - Mention direction AND magnitude if notable

5. CONTRADICTION HANDLING:
   If health_score is low BUT individual metrics (power, trust, battery, connectivity)
   look good — explicitly call this out and explain the likely cause
   (e.g., health formula weights one metric heavily, or a hidden factor like
   temperature or voltage is affecting it).

═══════════════════════════════════════
WHAT YOU ARE ALLOWED TO DO
═══════════════════════════════════════
✅ Use solar domain knowledge to explain WHY a value is what it is
✅ Combine sensor data + physics/engineering reasoning
✅ Infer conditions (e.g., "likely clear sky") when data supports it
✅ State if something is safe or needs attention
✅ Identify contradictions between health score and sub-metrics

═══════════════════════════════════════
WHAT YOU MUST NOT DO
═══════════════════════════════════════
❌ Invent sensor values not present in data
❌ Give generic solar tips unrelated to the current readings
❌ Say "data not sufficient" when partial data exists — use what's available

═══════════════════════════════════════
RESPONSE RULES
═══════════════════════════════════════
- 3–4 sentences max
- Always cite actual values from latest data
- Friendly, clear, non-robotic tone
- If health is poor, always name the weak sub-factor(s)

═══════════════════════════════════════
OUTPUT FORMAT (STRICT JSON)
═══════════════════════════════════════
Strictly respond with JSON in this format:
json
{
  "answer": "clear, friendly, data-grounded answer with domain reasoning",
  "summary": {
    "health": "good | average | poor | unknown",
    "efficiency": "high | normal | low | unknown",
    "trend": "increasing | decreasing | stable | volatile | unknown",
    "safety": "safe | caution | critical | unknown"
  }
}
`,
      },
    });

    const response1 = await chat.sendMessage({
      message: `
DATA (STRICT JSON):
latest:
${JSON.stringify(latest)}

history:
${JSON.stringify(parsed ? parsed.metric.slice(-30) : [])}

Warnings:
${JSON.stringify(alerts)}

QUESTION:
${message}



REMEMBER:
- Use only given data
- If unsure → say "Data is not sufficient"
- No assumptions
`,
    });

    let answer = response1.text
      .replace(/^\s*```json\s*/i, "")
      .replace(/\s*```\s*$/i, "");

    let output;

    output = JSON.parse(answer);

    console.log({ output });

    output = output.answer;
    console.log("Chat response 1:", response1.text);
    return res.status(200).json({
      message: "Ai response",
      data: output,
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Error processing chat",
      error: error.message,
      success: false,
    });
  }
});

export default chatRouter;
