const { Client, GatewayIntentBits, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { ApplicationCommandOptionType } = require('discord-api-types/v9');

// Discord 봇 설정
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

const commands = [
    {
        name: '서버 오픈요청',
        description: 'MMS 서버 오픈 요청 알림을 보냅니다.',
        options: [
            {
                name: '메시지',
                description: '알림에 포함할 추가 메시지',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
    },
];

// 쿨다운 관리를 위한 Map 객체
const cooldowns = new Map();
const COOLDOWN_SECONDS = 60; // 쿨다운 시간 (초)

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Discord 봇이 준비되었습니다.');

    // 슬래시 명령어 등록
    try {
        console.log('슬래시 명령어 등록 중...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        console.log('슬래시 명령어 등록 완료!');
    } catch (error) {
        console.error('Discord 명령어 등록 중 오류 발생:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction; // user 객체 추가

    if (commandName === '서버 오픈요청') {
        // 쿨다운 확인
        if (cooldowns.has(user.id)) {
            const expirationTime = cooldowns.get(user.id) + COOLDOWN_SECONDS * 1000;
            const currentTime = Date.now();

            if (currentTime < expirationTime) {
                const timeLeft = (expirationTime - currentTime) / 1000;
                return interaction.reply({
                    content: `잠시만 기다려주세요! 이 명령어는 ${timeLeft.toFixed(1)}초 후에 다시 사용할 수 있습니다.`,
                    ephemeral: true
                });
            }
        }

        // 쿨다운 설정
        cooldowns.set(user.id, Date.now());
        setTimeout(() => cooldowns.delete(user.id), COOLDOWN_SECONDS * 1000);

        const additionalMessage = interaction.options.getString('메시지');
        let notificationMessage = 'MMS서버 오픈 요청이 접수되었습니다. 알림을 확인해주세요!';
        if (additionalMessage) {
            notificationMessage += `\n추가 메시지: ${additionalMessage}`;
        }

        try {
            const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
            if (channel) {
                await channel.send(notificationMessage);
                await interaction.reply({ content: 'Discord 알림이 성공적으로 전송되었습니다.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Discord 채널을 찾을 수 없습니다. 채널 ID를 확인해주세요.', ephemeral: true });
            }
        } catch (error) {
            console.error('Discord 알림 전송 중 오류 발생:', error);
            await interaction.reply({ content: 'Discord 알림 전송에 실패했습니다.', ephemeral: true });
        }
    }
});

client.login(DISCORD_BOT_TOKEN);