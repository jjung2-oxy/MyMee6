
// MUSIC PLAYER PACKAGE

const { createReadStream } = require('fs');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, entersState } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

// DISCORD PACKAGE

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// GAME RELATED IMPORTS

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('rpg.db');


const { createProfile, getProfile, deleteProfile } = require('./game/character');
const { getInventory } = require('./game/inventory');
const { attack } = require('./combat');

const character = require('./game/character');
const combat = require('./game/combat');
const inventory = require('./game/inventory');
const story = require('./game/story');

// BOT TOKEN IMPORT

require('dotenv').config();

// CLIENT CREATION

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

// READY 

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    monitoredMessageId = null
});

// SAFELY CLOSE DATABSE

process.on('SIGINT', () => {
    db.close();
    process.exit();
});


// ON USER MESSAGE FUNCTIONS

client.on('messageCreate', async message => {

    // RPG COMMANDS

    // ATTACK COMMANDS 

    if (message.content === '!attack') { // CURRENTLY ATTACK LOGIC IS 50/50 WIN
        attack(message.author.id, (profile, resultMessage) => {
            if (profile) {
                message.reply(`${resultMessage}\nYour new stats: Health: ${profile.health}, Experience: ${profile.experience}, Gold: ${profile.gold}`);
            } else {
                message.reply(resultMessage);
            }
        });
    }

    // INVENTORY COMMANDS

    if (message.content === '!inventory') {
        getInventory(message.author.id, (inventory) => {
            if (inventory) {
                const inventoryList = inventory.map(item => `${item.item_name}: ${item.quantity}`).join('\n');
                message.reply(`Your inventory:\n${inventoryList}`);
            } else {
                message.reply('Your inventory is empty.');
            }
        });
    }

    // PROFILE COMMANDS

    if (message.content === '!deleteprofile') {
        deleteProfile(message.author.id, (success) => {
            if (success) {
                message.reply('Your profile has been successfully deleted.');
            } else {
                message.reply('There was an error deleting your profile.');
            }
        });
    }

    if (message.content === '!createprofile') {
        if (createProfile(message.author.id, message.author.username)) {
            message.reply('Profile created!');
        } else {
            message.reply('You have already created a profile.');
        }
    }

    if (message.content === '!profile') {
        getProfile(message.author.id, (profile) => {
            if (profile) {
                const profileEmbed = new EmbedBuilder()
                    .setColor('#0099ff') // You can choose any color
                    .setTitle(`${message.author.username}'s Profile`)
                    .addFields(
                        { name: 'Level', value: profile.level.toString(), inline: true },
                        { name: 'Experience', value: profile.experience.toString(), inline: true },
                        { name: 'Health', value: profile.health.toString(), inline: true },
                        { name: 'Mana', value: profile.mana.toString(), inline: true },
                        { name: 'Gold', value: profile.gold.toString(), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'RPG Bot', iconURL: client.user.displayAvatarURL() });

                message.reply({ embeds: [profileEmbed] });
            } else {
                message.reply('Profile not found.');
            }
        });
    }

    // CLEAR RECENT COMMAND

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

    // MUSIC PLAYER

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

// ROSE ASSIGNMENT USING REACIONS

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

// ROSE ASSIGNMENT USING REACIONS

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

// WELCOME NEW USERS

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome'); // Replace 'welcome' with your channel's name
    if (!channel) return;

    channel.send(`Welcome to the server, ${member}!`);
});

// CLIENT LOGIN WITH TOKEN

client.login(process.env.TOKEN);

