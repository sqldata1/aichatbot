import { NextResponse } from 'next/server';
import { MODEL } from '@/constants/model';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // Combine history with current message for context
    const messages = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch('http://217.154.5.46:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    // Return the Ollama response stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}