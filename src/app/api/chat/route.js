import OpenAI from "openai";

// Lazy init to avoid build-time error when env var isn't set
let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json();

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
    });

    const content = response.choices[0]?.message?.content || "Something went wrong.";

    return Response.json({ content });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: error.message || "Chat API failed" },
      { status: 500 }
    );
  }
}
