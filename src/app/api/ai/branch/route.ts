import { type NextRequest, NextResponse } from 'next/server'
import { generateBranch } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { noteContent, prompt, apiKey } = await req.json()
    if (!prompt || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const stream = await generateBranch(noteContent ?? '', prompt, apiKey)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
