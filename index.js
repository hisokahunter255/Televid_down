const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');

// التأكد من أن التوكن موجود في إعدادات البيئة
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch();
console.log('Bot is running...');

bot.on('text', (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return;

    ctx.reply('⏳ Processing and downloading...');

    const filename = `video_${Date.now()}.mp4`;

    // تحديد الأداة حسب النظام (Linux vs Windows)
    const isWindows = process.platform === 'win32';
    const downloadTool = isWindows ? `".\\yt-dlp.exe"` : "yt-dlp";

    // أمر تحميل يحاكي متصفحاً حقيقياً لتجاوز حماية يوتيوب
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const fullCmd = `${downloadTool} --user-agent "${userAgent}" -f "best[ext=mp4]" -o "${filename}" "${url}"`;

    exec(fullCmd, (error) => {
        if (error) {
            console.error(error);
            return ctx.reply('❌ Error: Could not download the video. It might be age-restricted or private.');
        }

        if (fs.existsSync(filename)) {
            ctx.replyWithVideo({ source: fs.createReadStream(filename) })
                .then(() => {
                    fs.unlinkSync(filename);
                })
                .catch((err) => {
                    console.error(err);
                    ctx.reply('❌ Failed to send video to Telegram.');
                });
        } else {
            ctx.reply('❌ Error: File was not created.');
        }
    });
});
