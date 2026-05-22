const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

// ضبط الـ webhook
if (process.env.WEBHOOK_URL) {
    bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/webhook`);
}

// دالة لتحميل الفيديو بـ yt-dlp وإرساله
async function downloadAndSend(ctx, url) {
    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join('/tmp', filename);

    return new Promise((resolve, reject) => {
        // تحميل بجودة مناسبة مع دمج الصوت والفيديو
        const cmd = `yt-dlp -f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best" --merge-output-format mp4 -o "${filepath}" "${url}"`;
        
        exec(cmd, async (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const stats = fs.statSync(filepath);
                const fileSizeMB = stats.size / (1024 * 1024);

                if (fileSizeMB > 50) {
                    // لو أكبر من 50MB، ابعت رابط مباشر بدل الملف
                    exec(`yt-dlp -g "${url}"`, async (err, out) => {
                        fs.unlinkSync(filepath);
                        if (err) {
                            await ctx.reply('❌ الفيديو كبير جداً ولا يمكن إرساله.');
                        } else {
                            await ctx.reply('⚠️ الفيديو أكبر من 50MB، إليك الرابط المباشر:\n' + out.trim().split('\n')[0]);
                        }
                        resolve();
                    });
                } else {
                    // إرسال الملف مباشرة
                    await ctx.replyWithVideo({ source: filepath });
                    fs.unlinkSync(filepath);
                    resolve();
                }
            } catch (e) {
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                reject(e);
            }
        });
    });
}

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return;

    await ctx.reply('⏳ جارٍ المعالجة...');

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTikTok = url.includes('tiktok.com');

    try {
        if (isYouTube) {
            // YouTube: yt-dlp مباشرة
            await downloadAndSend(ctx, url);

        } else if (isTikTok) {
            // TikTok: جرب TikWM الأول لأنه أسرع
            try {
                const tik = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                if (tik.data?.data?.play) {
                    await ctx.replyWithVideo({ url: tik.data.data.play });
                } else {
                    throw new Error('No URL from TikWM');
                }
            } catch {
                // fallback لـ yt-dlp
                await downloadAndSend(ctx, url);
            }

        } else {
            // باقي المواقع: جرب Cobalt الأول
            try {
                const response = await axios.post('https://cobalt.tools/api/json',
                    { url, vQuality: "720" },
                    { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
                );
                if (response.data?.url) {
                    await ctx.replyWithVideo({ url: response.data.url });
                } else {
                    throw new Error('No URL from Cobalt');
                }
            } catch {
                // fallback لـ yt-dlp
                await downloadAndSend(ctx, url);
            }
        }

    } catch (error) {
        console.error(error);
        await ctx.reply('❌ تعذر التحميل. الرابط غير مدعوم أو خاص.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
