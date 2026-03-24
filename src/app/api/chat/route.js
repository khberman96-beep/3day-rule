import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      temperature: 0.7,
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
