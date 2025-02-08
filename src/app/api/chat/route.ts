import { NextResponse } from 'next/server';

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

    const response = await fetch('http://87.106.44.88:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen2.5:0.5b",
        prompt: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseMessage = data.response;

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}