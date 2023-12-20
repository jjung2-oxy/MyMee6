const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION"], // Enable partials
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log("Bot is ready and listening for events");
    monitoredMessageId = null
});


client.on('messageCreate', async message => {
    console.log("Message received: " + message.content); 

    if (!message.guild) return;
    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            message.reply('Please provide a YouTube URL.');
            return;
        }
        const songUrl = args[1];
        if (!ytdl.validateURL(songUrl)) {
            message.reply('Please provide a valid YouTube URL.');
            return;
        }

        const channel = message.member.voice.channel;
        if (!channel) {
            message.reply('You need to be in a voice channel to play music!');
            return;
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const stream = ytdl(songUrl, { filter: 'audioonly' });
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        const player = createAudioPlayer();

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => connection.destroy());
    }
    
    if (message.content === '!join') {
        let role = message.guild.roles.cache.find(r => r.name === "Member"); // Replace "Member" with your role's name

        if (role) {
            try {
                await message.member.roles.add(role);
                message.reply("You have been given the Member role!");
            } catch (error) {
                console.error("Error adding role:", error);
                message.reply("Sorry, I couldn't assign the role.");
            }
        } else {
            message.reply("Role not found.");
        }
    }

    if (message.content === 'ping') {
        message.reply('pong');
    }

    if (message.content === '!test') {
        // Simulate the guildMemberAdd event
        client.emit('guildMemberAdd', message.member);
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
