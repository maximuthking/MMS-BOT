const { Client, GatewayIntentBits } = require('discord.js');

// Discord 봇 설정
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
// CLIENT_ID는 메시지 명령어에서는 필요하지 않습니다.

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // 메시지 내용을 읽기 위해 필요
    ]
});

// 쿨다운 관리를 위한 Map 객체
const cooldowns = new Map();
const COOLDOWN_SECONDS = 60; // 쿨다운 시간 (초)

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Discord 봇이 준비되었습니다. 이제 Discord에서 !서버요청 명령어를 사용할 수 있습니다.');
});

client.on('messageCreate', async message => {
    // 봇 자신이 보낸 메시지는 무시
    if (message.author.bot) return;

    // '!서버요청' 명령어를 감지
    if (message.content.startsWith('!서버요청')) { // startsWith로 변경하여 추가 메시지 파싱 가능
        // 쿨다운 확인
        if (cooldowns.has(message.author.id)) {
            const expirationTime = cooldowns.get(message.author.id) + COOLDOWN_SECONDS * 1000;
            const currentTime = Date.now();

            if (currentTime < expirationTime) {
                const timeLeft = (expirationTime - currentTime) / 1000;
                return message.reply(`잠시만 기다려주세요! 이 명령어는 ${timeLeft.toFixed(1)}초 후에 다시 사용할 수 있습니다.`);
            }
        }

        // 쿨다운 설정
        cooldowns.set(message.author.id, Date.now());
        setTimeout(() => cooldowns.delete(message.author.id), COOLDOWN_SECONDS * 1000);

        let notificationMessage = 'MMS서버 오픈 요청이 접수되었습니다. 알림을 확인해주세요!';
        // 메시지 명령어에서는 추가 메시지 옵션을 직접 파싱해야 합니다.
        // 예: '!서버요청 추가 메시지 내용'
        const args = message.content.split(' ');
        if (args.length > 1) {
            const additionalMessage = args.slice(1).join(' ');
            notificationMessage += `\n추가 메시지: ${additionalMessage}`;
        }

        try {
            const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
            if (channel) {
                await channel.send(notificationMessage);
                message.reply('Discord 알림이 성공적으로 전송되었습니다.');
            } else {
                message.reply('Discord 채널을 찾을 수 없습니다. 채널 ID를 확인해주세요.');
            }
        } catch (error) {
            console.error('Discord 알림 전송 중 오류 발생:', error);
            message.reply('Discord 알림 전송에 실패했습니다.');
        }
    }
});

client.login(DISCORD_BOT_TOKEN);