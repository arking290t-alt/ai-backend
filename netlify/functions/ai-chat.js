export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Only POST allowed" };
  }

  const { message, appData } = JSON.parse(event.body);

  const systemPrompt = `
You are an AI assistant for this web application.
Use ONLY the following app data to answer.

APP DATA (JSON):
${JSON.stringify(appData, null, 2)}
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.choices[0].message.content
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI failed" })
    };
  }
}

