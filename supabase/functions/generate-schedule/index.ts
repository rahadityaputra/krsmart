const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ScheduleInput {
  id: number;
  courseCode: string;
  courseName: string;
  className: string;
  credits: number;
  schedule: string;
  lecturer?: string;
}

interface GeneratePlanRequest {
  prompt: string;
  schedules: ScheduleInput[];
}

function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    console.log(apiKey);

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");

      return jsonResponse(
        { error: "AI service is not configured" },
        500,
      );
    }

    const body = await req.json() as GeneratePlanRequest;

    const { prompt, schedules } = body;

    if (
      typeof prompt !== "string" ||
      prompt.trim().length === 0
    ) {
      return jsonResponse(
        { error: "Prompt is required" },
        400,
      );
    }

    if (prompt.length > 3000) {
      return jsonResponse(
        { error: "Prompt is too long" },
        400,
      );
    }

    if (
      !Array.isArray(schedules) ||
      schedules.length === 0 ||
      schedules.length > 200
    ) {
      return jsonResponse(
        { error: "Schedules must contain 1 to 200 items" },
        400,
      );
    }

    const normalizedSchedules: ScheduleInput[] = [];

    for (const schedule of schedules) {
      if (
        typeof schedule.id !== "number" ||
        typeof schedule.courseCode !== "string" ||
        typeof schedule.courseName !== "string" ||
        typeof schedule.className !== "string" ||
        typeof schedule.schedule !== "string" ||
        typeof schedule.credits !== "number"
      ) {
        return jsonResponse(
          { error: "Invalid schedule data" },
          400,
        );
      }

      normalizedSchedules.push({
        id: schedule.id,
        courseCode: schedule.courseCode,
        courseName: schedule.courseName,
        className: schedule.className,
        credits: schedule.credits,
        schedule: schedule.schedule,
        lecturer: schedule.lecturer,
      });
    }

    const systemInstruction = `
The response must follow this structure:

{
  "schedules": [{ "id": 123 }],
  "reasoning": "string"
}

Return only schedules from the provided list, using their exact id values.
Do not return duplicate course codes or overlapping schedules.`;

    const userContent = JSON.stringify({
      studentRequest: prompt,
      availableSchedules: normalizedSchedules,
    });

    const model =
      Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: userContent }],
            },
          ],
        }),
      },
    );

    const data = await geminiResponse.json();
    const hasilTeks = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!geminiResponse.ok) {
      console.error(
        "Gemini API error:",
        geminiResponse.status,
      );

      if (geminiResponse.status === 429) {
        return jsonResponse(
          { error: "AI request limit reached. Try again later." },
          429,
        );
      }

      return jsonResponse(
        { error: "Failed to generate schedule with AI" },
        502,
      );
    }

    const generatedText =
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("");

    if (!generatedText) {
      return jsonResponse(
        { error: "Gemini returned an empty response" },
        502,
      );
    }

    let generatedPlan;

    try {
      const cleanText = generatedText
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      generatedPlan = JSON.parse(cleanText);
    } catch {
      console.error("Gemini returned invalid JSON");

      return jsonResponse(
        { error: "AI returned an invalid plan format" },
        502,
      );
    }

    console.log("ini generated plan setelah di convert ke struktur yang lebih rapi")
    console.log(generatedPlan);

    if (
      !generatedPlan ||
      !Array.isArray(generatedPlan.schedules) ||
      !generatedPlan.schedules.every(
        (item: unknown) =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { id?: unknown }).id === "number",
      )
    ) {
      return jsonResponse(
        { error: "AI returned an invalid schedule format" },
        502,
      );
    }

    const availableIds = new Set(normalizedSchedules.map((schedule) => schedule.id));
    const generatedIds = new Set<number>();
    const invalidId = generatedPlan.schedules.some((item: { id: number }) => {
      if (!availableIds.has(item.id) || generatedIds.has(item.id)) return true;
      generatedIds.add(item.id);
      return false;
    });
    if (invalidId) {
      return jsonResponse(
        { error: "AI returned a schedule outside the provided list" },
        502,
      );
    }

    return jsonResponse({
      schedules: generatedPlan.schedules,
      reasoning:
        typeof generatedPlan.reasoning === "string"
          ? generatedPlan.reasoning
          : undefined,
    });

  } catch (error) {
    console.log("hello")
    console.error(error)
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonResponse(
        { error: "AI request timed out. Please try again." },
        504,
      );
    }

    console.error("Generate schedule error:", error);

    return jsonResponse(
      { error: "Internal server error" },
      500,
    );
  }
});