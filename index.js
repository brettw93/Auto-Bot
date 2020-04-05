// Auto-Bot 2.0
// Lets see how broken this ends up.

// Very Safe Key Storage
const DiscordToken = require('./bottoken.json').token;

const Discord = require('discord.js');
const client = new Discord.Client();
client.once('ready', () => {
	console.log("Ready!");
});

client.login(DiscordToken);
