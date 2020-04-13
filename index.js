// Auto-Bot 2.0
// Lets see how broken this ends up.

// Very Safe Key Storage
const DiscordToken = require('./bottoken.json').token;

const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
client.once('ready', () => {
	console.log("Ready!");
});

var AutoChannels = [];
var CreatorChannels = [];

var UserChannelTracker = {};

// Load Channel List
CreatorChannels = ReadCreatorChannels();
if (!CreatorChannels) {
	console.log("Failed to read Creator Channels List. Recreating");
	CreatorChannels = [];
	WriteCreatorChannels();
}

// Voice State

client.on("voiceStateUpdate", (oldState, newState) => {
	if (oldState && newState) {
		if (oldState.channelID === newState.channelID) {
			return;
		}
	}

	if (oldState && oldState.channelID) {
		ChannelLeave(oldState.member, oldState.guild.channels.resolve(oldState.channelID));
	}
	if (newState && newState.channelID) {
		ChannelJoin(newState.member, newState.guild.channels.resolve(newState.channelID));
	}
});

// Chat Commands

client.on("message", (message) => {
	let author = message.author;
	let content = message.cleanContent;
	if (author.bot) return;

	// Match rename command & new channel name
	let commandtest = /\.rename\s(.*)/gi;
	let commandresults = commandtest.exec(content);

	if (commandresults){
		let newChannelName = commandresults[1];
		if (UserChannelTracker[author.id]) {
			let UserChannel = UserChannelTracker[author.id];
			if (UserChannel.id && UserChannel.manageable) {
				UserChannel.setName(newChannelName)
				.then(newChannel => {
					message.reply(`Successfully renamed the channel to ${newChannel.name}`);
				}).catch((err) => {
					message.reply("Sorry there was an error renaming the channel.");
					console.error(err);
				});
			} else {
				message.reply("Sorry, either the channel doesn\'t exist, or I don\'t have permissions to edit it.");
			}
		} else {
			message.reply("Sorry, I don't appear to know what channel you\'re in right now. Please rejoin and try again.");
		}
	}
	if (message.guild.ownerID == message.author.id) {
		if (content.startsWith(".creator")) {
			if (UserChannelTracker[author.id]) {
				let UserChannel = UserChannelTracker[author.id];
				if (CreatorChannels.indexOf(UserChannel.id) < 0) {
					CreatorChannels.push(UserChannel.id);
					WriteCreatorChannels();
					message.reply("Added the new Creator Channel Boss.");
				} else {
					message.reply("Boss that channels already a Creator channel.");
				}
			} else {
				message.reply("Sorry boss, I don't know what channel you\'re in.");
			}
		}
	}
});

client.login(DiscordToken);

// Channel Functions

function ChannelLeave(member, channel) {
	let userCount = GetChannelUserCount(channel);
	UserChannelTracker[member.id] = {};
	if (userCount == 0 && channel) {
		if (CreatorChannels.indexOf(channel.id) < 0) {
			channel.delete();
		}
	}
}

function ChannelJoin(member, channel) {
	let userCount = GetChannelUserCount(channel);
	UserChannelTracker[member.id] = channel;
	if (CreatorChannels.indexOf(channel.id) > -1) {
		CreateAutoChannel(member, channel);
	}
}

function GetChannelUserCount(channel) {
	if (channel) {
		return channel.members.reduce((acc, member) => acc + 1, 0);
	}
	return 0;
}

function CreateAutoChannel(member, channel) {
	console.log("Creating Channel");
	channel.clone({
		name: `${member.displayName}'s Channel`
	})
	.then (newChannel => {
		member.voice.setChannel(newChannel);
	}).catch(console.error);
}


// FS Functions

function WriteCreatorChannels() {
	fs.open('channellist.json', 'w', (err, fd) => {
  		if (err) {
    			throw err;
  		}
		fs.writeSync(fd, JSON.stringify(CreatorChannels));
		fs.close(fd, (err) => {
			if (err) throw err;
			return true
		});
	});
}

function ReadCreatorChannels() {
	let channellist;
	try {
		channellist = fs.readFileSync('channellist.json', 'utf8');
		return JSON.parse(channellist);
	} catch (e) {
		console.error(e);
		return false;
	}
}
