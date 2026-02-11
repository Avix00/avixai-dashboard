import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request: NextRequest) {
    try {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return NextResponse.json(
                { message: 'Telegram configuration missing' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const userEmail = formData.get('userEmail') as string;
        const companyName = formData.get('companyName') as string;
        const screenshot = formData.get('screenshot') as File | null;

        // Construct message text
        const messageText = `
🆘 *Nuova Richiesta di Supporto*

👤 *Utente:* ${userEmail}
🏢 *Azienda:* ${companyName || 'N/A'}

📝 *Oggetto:* ${title}

💬 *Descrizione:*
${description}
        `.trim();

        // If there's a screenshot, send as photo
        if (screenshot && screenshot.size > 0) {
            const telegramFormData = new FormData();
            telegramFormData.append('chat_id', TELEGRAM_CHAT_ID);
            telegramFormData.append('caption', messageText);
            telegramFormData.append('parse_mode', 'Markdown');
            telegramFormData.append('photo', screenshot);

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: telegramFormData,
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Telegram API Error (Photo):', error);
                throw new Error('Failed to send photo to Telegram');
            }
        } else {
            // Text only message
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: messageText,
                    parse_mode: 'Markdown',
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Telegram API Error (Message):', error);
                throw new Error('Failed to send message to Telegram');
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Support API Error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
