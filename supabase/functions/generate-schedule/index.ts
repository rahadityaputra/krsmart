
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CourseInput {
  courseCode: string;
  courseName: string;
  className: string;
  credits: number;
  // capacity?: number;
  schedule: string;
  // room?: string;
  lecturer?: string;
}

interface GeneratePlanRequest {
  prompt: string;
  courses: CourseInput[];
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
  // 1. Handle CORS
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
    // 2. Read API key
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    console.log(apiKey);

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");

      return jsonResponse(
        { error: "AI service is not configured" },
        500,
      );
    }

    // 3. Parse request
    const body = await req.json() as GeneratePlanRequest;

    const { prompt, courses } = body;

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
      !Array.isArray(courses) ||
      courses.length === 0 ||
      courses.length > 200
    ) {
      return jsonResponse(
        { error: "Courses must contain 1 to 200 items" },
        400,
      );
    }

    // 4. Validate and normalize course data
    const normalizedCourses: CourseInput[] = [];

    for (const course of courses) {
      if (
        typeof course.courseCode !== "string" ||
        typeof course.courseName !== "string" ||
        typeof course.className !== "string" ||
        typeof course.schedule !== "string" ||
        typeof course.credits !== "number"
      ) {
        return jsonResponse(
          { error: "Invalid course data" },
          400,
        );
      }

      normalizedCourses.push({
        courseCode: course.courseCode,
        courseName: course.courseName,
        className: course.className,
        credits: course.credits,
        // capacity: course.capacity,
        schedule: course.schedule,
        // room: course.room,
        lecturer: course.lecturer,
      });
    }

    // 5. Prepare Gemini prompt
//     const systemInstruction = `
// You are an academic schedule planning assistant.

// Your task is to create a student's course plan
// using only the available course offerings.

// Rules:
// 1. Only select courses from the provided list.
// 2. Never invent course codes or class names.
// 3. Respect the student's instructions and preferences.
// 4. Avoid overlapping class schedules.
// 5. Consider the number of credits requested by the student.
// 6. If the request cannot be fully satisfied, explain why.
// 7. Do not assume missing information.
// 8. Return valid JSON only.

// The response must follow this structure:

// {
//   "summary": "string",
//   "selectedCourses": [
//     {
//       "courseCode": "string",
//       "className": "string",
//       "reason": "string",
//       "schedule" : {          
//           "day": "string",
//           "intervalTime" : {
//             "start" : "string",
//             "end" : "string"
//           },
//       } 
      
//     }
//   ],
//   "warnings": ["string"]
// }

// The courseCode and className must match
// an offering from the provided course list exactly.
// `;

const systemInstruction = `
The response must follow this structure:

{
  "summary": "string",
  "selectedCourses": [
    {
      "courseCode": "string",
      "className": "string",
      "reason": "string",
      "schedule" : {          
          "day": "string",
          "intervalTime" : {
            "start" : "string",
            "end" : "string"
          },
      } 
      
    }
  ],
  "warnings": ["string"]
}`;



    const userContent = JSON.stringify({
      studentRequest: prompt,
      availableCourses: normalizedCourses,
    });



    // 6. Call Gemini API
    const model =
      Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";

    // const geminiResponse = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-goog-api-key": apiKey,
    //     },
    //     body: JSON.stringify({
    //       systemInstruction: {
    //         parts: [{ text: systemInstruction }],
    //       },
    //       contents: [
    //         {
    //           role: "user",
    //           parts: [{ text: userContent }],
    //         },
    //       ],
    //       generationConfig: {
    //         responseMimeType: "application/json",
    //         temperature: 0.2,
    //         maxOutputTokens: 4096,
    //       },
    //     }),
    //     signal: AbortSignal.timeout(55_000),
    //   },
    // );

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
          // parts: [{ text: "coba buatkan jadwal untuk saya ?" }],
        },
      ],
    }),
  },
);

const data = await geminiResponse.json();
const hasilTeks = data.candidates?.[0]?.content?.parts?.[0]?.text;

// console.log(hasilTeks)

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

    // 8. Parse JSON result
    let generatedPlan;

    try {
      generatedPlan = JSON.parse(generatedText);
    } catch {
      console.error("Gemini returned invalid JSON");

      return jsonResponse(
        { error: "AI returned an invalid plan format" },
        502,
      );
    }


    console.log("ini generated plan setelah di convert ke struktur yang lebih rapi")
    console.log(generatedPlan);

    // 9. Return result to React
    return jsonResponse({
      success: true,
      plan: generatedPlan,
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
