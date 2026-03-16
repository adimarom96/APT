import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `אתה עוזר מומחה להשקעות נדל"ן בישראל. תפקידך לעזור למשקיעים לראשונה להבין את שוק הנדל"ן הישראלי.

## הנחיות:
- ענה תמיד בעברית
- הסבר מושגים בצורה ברורה ופשוטה
- הסתמך על נתוני שוק אמיתיים כשניתן
- ציין תמיד שהמידע הוא לצורך למידה בלבד ואינו ייעוץ השקעות מקצועי
- כשמדובר בחישובים (תשואה, משכנתא, מס רכישה) — הסבר את הנוסחאות

## נושאים שאתה יכול לעזור בהם:
- חישוב תשואה גולמית ונטו
- סימולציית משכנתא
- מס רכישה (לדירה ראשונה ולמשקיע)
- השוואת אזורים ועיירות
- מגמות מחירים
- שיקולים לפני קנייה להשקעה
- מושגים: גוש/חלקה, טאבו, עסקת קומבינציה, שכר דירה מוגן

## הגבלות:
- אל תמליץ על נכסים ספציפיים
- הוסף הסתייגות: "המידע הוא לצורך למידה בלבד ואינו מהווה ייעוץ פיננסי או השקעות"

הגיב בעברית תקנית וברורה.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, cityContext } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      cityContext?: { city: string; avgPricePerSqm: number; dealCount: number };
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Optionally inject city context into system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (cityContext) {
      systemPrompt += `\n\n## נתוני שוק נוכחיים (${cityContext.city}):
- מחיר ממוצע למ"ר: ₪${cityContext.avgPricePerSqm.toLocaleString('he-IL')}
- עסקאות ב-12 חודשים אחרונים: ${cityContext.dealCount.toLocaleString('he-IL')}`;
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('/api/chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
