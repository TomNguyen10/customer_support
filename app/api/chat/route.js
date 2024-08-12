import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

const systemPrompt =
  "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly. User: Hello, who are you? AI: I'm an AI assistant here to help you. User: What can you do for me? AI: I can answer questions, provide information, and assist with a variety of tasks. User: That's great! Can you tell me more about yourself? AI: I'm a language model created by OpenAI, designed to assist users with natural language processing tasks. User: How do you work? AI: I analyze text input and generate responses based on patterns and information in the data I've been trained on. User: That's fascinating! AI: Thank you! I'm here to help you with any questions or tasks you have. User: How can I get started? AI: Just ask me anything, and I'll do my best to assist you.";

export async function POST(req) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 });
  }

  const openai = new OpenAI(apiKey); // Create a new instance of the OpenAI client
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: "gpt-3.5-turbo", // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
