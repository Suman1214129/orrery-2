const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free'

export async function generateBranch(
  context: string,
  prompt: string,
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://orrery.app',
      'X-Title': 'Orrery',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a creative writing assistant embedded in Orrery, a branching narrative tool. 
The user will give you a piece of writing up to a checkpoint, and ask "what if" something went differently. 
Continue the story from that checkpoint in a new direction based on their prompt. 
Match the tone, style, and voice of the original writing. 
Write only the continuation — no preamble, no meta-commentary.`,
        },
        {
          role: 'user',
          content: `Here is the writing so far:\n\n${context}\n\n---\n\nWhat if: ${prompt}\n\nContinue from this point:`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error: ${res.status} ${err}`)
  }

  return res.body!
}

export async function askAboutNote(
  noteContent: string,
  question: string,
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://orrery.app',
      'X-Title': 'Orrery',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a thoughtful writing assistant in Orrery. 
You help writers explore their work by answering questions, suggesting alternatives, and thinking through narrative possibilities. 
Be concise, insightful, and match the tone of the writing.`,
        },
        {
          role: 'user',
          content: `Here is the note/document:\n\n${noteContent}\n\n---\n\n${question}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error: ${res.status} ${err}`)
  }

  return res.body!
}
