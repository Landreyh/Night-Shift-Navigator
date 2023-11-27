require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

client.on('ready', () => {
    console.log('Battlecruiser Operational');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['',]; // Insert ChannelID within the ''

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) 
    return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    // Custom instructions for the AI as a College Algebra instructor
    let customInstructions = ``; // Insert your custom prompt for your Tutor within the ''

    // Start the conversation with custom instructions
    let conversation = [{
        role: 'system',
        content: customInstructions
    }];

    let prevMessages = await message.channel.messages.fetch({ limit: 10 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        if(msg.author.bot && msg.author.id !== client.user.id) return;
        if(msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        conversation.push({
            role: msg.author.id === client.user.id ? 'assistant' : 'user',
            name: username,
            content: msg.content,
        });
    });

    const response = await openai.chat.completions
    .create({
        model: 'gpt-4',
        messages: conversation,
    })
    .catch((error) => {
        console.error('OpenAI Error:\n', error);
        clearInterval(sendTypingInterval);
        message.reply("I am having some trouble with the OpenAI API. Try again in a moment.");
    });

    if (response) {
        clearInterval(sendTypingInterval);
        const responseMessage = response.choices[0].message.content;
        const chunkSizeLimit = 2000;

        for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit);
            await message.reply(chunk);
        }
    }
});

client.login(process.env.TOKEN);
