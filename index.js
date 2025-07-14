const { Client, GatewayIntentBits, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { ApplicationCommandOptionType } = require('discord-api-types/v9'); // v10으로 변경될 수 있음

// Discord 봇 설정
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // 메시지 내용을 읽기 위해 필요 (슬래시 명령어에는 필수는 아님)
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Discord 봇이 준비되었습니다.');

    // 슬래시 명령어 등록
    try {
        console.log('슬래시 명령어 등록 중...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID), // 전역 명령어 등록
            // Routes.applicationGuildCommands(CLIENT_ID, 'YOUR_GUILD_ID'), // 특정 길드에만 등록 (테스트용)
            { body: commands },
        );
        console.log('슬래시 명령어 등록 완료!');
    } catch (error) {
        console.error('Discord 명령어 등록 중 오류 발생:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === '서버 오픈요청') {
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