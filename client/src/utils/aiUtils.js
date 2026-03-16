export const AI_RESPONSES = {
  default:
    "I can help analyze your microgrid performance.",
  efficiency:
    "Current system efficiency is 65%. Dust accumulation is the main issue.",
  battery:
    "Battery bank is at 71% state of charge.",
};

export function getAIResponse(query) {
  const q = query.toLowerCase();

  if (q.includes("effici")) return AI_RESPONSES.efficiency;
  if (q.includes("batter")) return AI_RESPONSES.battery;

  return AI_RESPONSES.default;
}