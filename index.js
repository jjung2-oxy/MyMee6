const { createReadStream } = require('fs');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, entersState } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { Client, GatewayIntentBits } = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION"], // Enable partials
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    monitoredMessageId = null
});


client.on('messageCreate', async message => {

    if (message.content === '!clearRecent') {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply('You do not have permission to clear messages.');
        }

        const channel = message.channel;
        try {
            let fetched;
            do {
                fetched = await channel.messages.fetch({ limit: 100 });
                // Filter out messages older than 14 days
                const filteredMessages = fetched.filter(msg => Date.now() - msg.createdTimestamp < 1209600000); // 14 days in milliseconds
                if (filteredMessages.size > 0) {
                    await channel.bulkDelete(filteredMessages, true);
                }
            }
            while (fetched.size >= 2);
        } catch (error) {
            console.error('Error deleting messages:', error);
            message.reply('There was an error trying to clear messages in this channel.');
        }
    }

    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Please provide a YouTube URL.');
        }
        const songUrl = args[1];
        if (!ytdl.validateURL(songUrl)) {
            return message.reply('Please provide a valid YouTube URL.');
        }

        const channel = message.member.voice.channel;
        if (!channel) return message.reply('You need to be in a voice channel to play music!');

        let connection;
        try {
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            console.log("Voice connection created");

            await entersState(connection, VoiceConnectionStatus.Ready, 30e3);

            const ytdl = require('ytdl-core');
            const fs = require('fs');

            const url = 'https://www.youtube.com/watch?v=kruKQCY77bc&list=RDkruKQCY77bc&start_radio=1&ab_channel=Steinway%26Sons'; // Replace with your YouTube URL


            const stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });
            stream.pipe(fs.createWriteStream('output.mp3'));

            stream.on('finish', () => {
                console.log('Stream finished');
            });

            stream.on('error', err => {
                console.error('Stream error:', err);
            });

            const resource = createAudioResource(stream);
            const player = createAudioPlayer();

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                console.log("The audio player has started playing!");
            });
            player.on('error', error => console.error('Error:', error.message));


        } catch (error) {
            console.error('Failed to join voice channel or play audio:', error);
            if (connection) {
                connection.destroy();
            }
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id === '284442222173093888' && reaction.emoji.name === '🔒') {
        monitoredMessageId = reaction.message.id;
        // Store this messageId as the one to monitor
        console.log("messageId stored");
    }

    if (reaction.message.id === monitoredMessageId && reaction.emoji.name === '🟩') { // Check for the green square emoji
        const member = await reaction.message.guild.members.fetch(user.id);
        const role = reaction.message.guild.roles.cache.find(role => role.name === "Member");

        if (role) {
            try {
                await member.roles.add(role);
                console.log(`Role ${role.name} added to user ${user.tag}`);
            } catch (error) {
                console.error("Error adding role:", error);
            }
        } else {
            console.log("Role not found");
        }
    }

});

client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.message.id === monitoredMessageId && reaction.emoji.name === '🟩') { // Check for the green square emoji
        const member = await reaction.message.guild.members.fetch(user.id);
        const role = reaction.message.guild.roles.cache.find(role => role.name === "Member");

        if (role) {
            try {
                await member.roles.remove(role);
                console.log(`Role ${role.name} removed from user ${user.tag}`);
            } catch (error) {
                console.error("Error removing role:", error);
            }
        } else {
            console.log("Role not found");
        }
    }
});


client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome'); // Replace 'welcome' with your channel's name
    if (!channel) return;

    channel.send(`Welcome to the server, ${member}!`);
});

client.login(process.env.TOKEN);

