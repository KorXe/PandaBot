// Check the version of Node.
// If not appropriate, throw error.
if (process.version.slice(1).split(".")[0] < 8)
    throw new Error("This bot requires Node 8.0.0 or higher. Please update.");

// Load up the discord.js library
const Discord = require("discord.js");

// The Discord Client/User/Bot w/e
const client = new Discord.Client();

// Here we load the config.json file that contains our prefix value.
// Other values are planned to be stored here in the future... I just do not know what yet.
const config = require("./Config/config.json");
// config.prefix contains the message prefix.

// The authentication file should/will not be included in the repository.
// Please generate your own bot authentication token and create the necessary file.
const authentication = require("./Config/authentication.json");
// authentication.token contains the bot's token

const fs = require("fs");

const Enmap = require("enmap");

// Formatting constants
const bold = "**";
const italic = "_";
const underline = "__"
const strikethrough = "~~";
const space = " ";


client.commands = new Enmap();
client.config = config;

client.on("ready", () => {
    // Set the bot's 'game' status to the number of servers it is in
    client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`on ${client.guilds.size} servers`);
});

// Name: messageIsForBot
// Parameters: message - The message from the Discord chat
// Returns:
//        False -- if the message originated from a bot or the message does not
//                 begin with the bot command prefix
//        True
function messageIsForBot(message) {
    return (!message.author.bot && message.content.startsWith(config.prefix))
}

// JSON style list of commands and their associated functionality
var commands = {
    "help": {
        usage: "(optional)<command>",
        description: "Shows information on the various commands.\n\t" + "If a command is supplied, shows the information of that command if possible.\n\t" + "Otherwise, this message is shown.",
        process: function(bot, message, suffix) {
            // Declare necessary vars and other processing
            // Check if we need to display just the basic list of commands
            if(!suffix) {
                message.author.send(bold + "Available Commands:" + bold).then(function() {
                    var helpMsg = "";
                    var sortedCommands = Object.keys(commands).sort();
                    for (var command in sortedCommands) {
                        var cmd = sortedCommands[command];
                        helpMsg += bold + config.prefix + cmd + bold;
                        helpMsg += (commands[cmd].usage)? " " + commands[cmd].usage : "";
                        helpMsg += (commands[cmd].description) ? "\n\t" + commands[cmd].description : "";
                        helpMsg += "\n";
                    }
                    message.author.send(helpMsg);
                    message.reply("The command list has been sent to your PMs.");
                });
            } else {
                // The author asked for help on a specific command. Send the help for that command.
                var command = suffix.split(space)[0];
                if (!commands[command]) {
                    // The user wanted help on a specific command, but it is not one we have. Send message stating so and show usage.
                    message.reply(bold + command + bold + " is not an available command.\n" + "Showing " + bold + "help" + bold + " usage.");
                    command = "help";
                }
                var helpMsg = bold + config.prefix + command + bold;
                helpMsg += (commands[command].usage)? " " + commands[command].usage : "";
                helpMsg += (commands[command].description) ? "\n\t" + commands[command].description : "";
                message.reply(helpMsg);
            }
        }
    }, // end of help
    "ping": {
        usage: "",
        description: "Responds with 'pong!' to the messager.",
        process: function(bot, message, suffix) {
            const m = /*await*/ message.reply("pong!");
        }
    }, // end of ping
    "say": {
        usage: "<message>",
        description: "The bot will respond with the provided message. The bot will also delete the initiating message.",
        process: function(bot, message, suffix) {
            const m = /*await*/ message.channel.send(suffix);
            message.delete().catch(err => {
                console.log(err);
            });
        }
    }, // end of say
    "announce": {
        usage: "<message>",
        description: "The bot will respond with the provided message via TTS. The bot will also delete the initiating message.",
        process: function(bot, message, suffix) {
            const m = /*await*/ message.channel.send(suffix, {tts:true});
            message.delete().catch(err => {
                console.log(err);
            });
        }
    }, // end of announce
    "summon" : {
        usage: "<@user> (optional)<message>",
        description: "The bot will send a message to the mentioned user, tell them their presence is requested by the sender, and pass along a message if given.",
        process: function(bot, message, suffix) {
            if (message.mentions.members.first() != null) {
                // There was a member mentioned in the message. Message the user and pass along the message if given.
                var summoned = message.mentions.members.first();
                var passedMessage = suffix.split(space).slice(1).join(space);
                var summonMessage = summoned.user.username + ", you have been summoned by " + message.author + " in " + message.channel + " of " + message.guild + ".";
                summonMessage += (passedMessage.length > 0) ? "\nTheir message is: " + passedMessage : "";
                message.delete().catch(err => {
                    console.log(err);
                });
                summoned.send(summonMessage);
            } else {
                // No user or message given. Reply with an error.
                message.reply("Invalid use of the summon command. Please refer to " + config.prefix + "help summon for proper usage.");
            }

        }
    },
    "roll" : {
        usage: "<# of dice>d<dice limit> [+/- <# of dice>d<dice limit> ...]",
        description: "The bot will roll the dice mentioned in the message. \nNote: There " + italic + "must" + italic + " be a space between dice and operators.\n" + "Example: 4d6 + 3d2 = 4 6-sided dice plus 3 2-sided dice.",
        process: function(bot, message, suffix) {
            // These are the only characters allowed in the command
            const validChars = /^[d+\-0-9 ]+$/;
            // Split the suffix on the space to separate the dice rolls from the operators
            const arguments = suffix.split(space);
            // This will hold an array of dice
            // eg. !roll 1d6 => dicePairs[0] = [1,6]
            var dicePairs = [];
            // This will hold the operators
            var operators = [];

            // Check that the contents of the array are in the correct format
            var validFormat = true;
            arguments.forEach((element, index) => {
                switch(index % 2) {
                    case 0:
                        const format = /^[0-9]+[d][0-9]+$/
                        validFormat &= element.match(format) != null;
                        dicePairs.push(element.split("d"));
                        break;
                    case 1:
                        validFormat &= (element === "+" || element === "-");
                        operators.push(element);
                        break;
                }
            });
            // Only parse the objects if the string has the valid characters, length, and operators to dice ratios.
            if (suffix.match(validChars) && arguments.length % 2 === 1 && validFormat) {
                // All of the dice and operators have been parsed out. Now to do the rolling and give the result
                var resultStr = bold + "Result: " + bold;
                var totalStr = bold + "Total: " + bold;
                var total = 0;
                var useOperator = false;
                do {
                    var dicePair = dicePairs.shift();
                    var operator = (useOperator && operators.length > 0) ? operators.shift() : "";
                    var rolls = [];
                    for(k = 0; k < dicePair[0]; k++) {
                        var rand = Math.floor(Math.random() * dicePair[1] + 1);
                        total += (operator === "-") ? rand * -1: rand;
                        rolls.push(rand);
                    }
                    // Add the roll to the value
                    resultStr += (operator != "") ? operator + " " : operator;
                    resultStr += dicePair.join("d") + " (" + rolls.join(", ") + ") ";
                    useOperator = true;
                } while (dicePairs.length > 0)

                totalStr += total;
                var responseStr = ":game_die:\n" + resultStr + "\n" + totalStr;
                message.reply(responseStr);
            } else {
                message.reply("Invalid use of the roll command. Please refer to " + config.prefix + "help roll for proper usage");
            }
        }
    }
}

// This call gets run everytime a message is put into chat
// We will pass the message along to the anonymous function and have it search for bot specific messages and respond accordingly.
client.on("message", async message => {

// Check if the message is for us (the bot)
    if (messageIsForBot(message)) {
        // Find the command given
        // Take the first block of text before a space and strip out the command prefix
        var command = message.content.split(space)[0].substring(config.prefix.length);
        var suffix = message.content.substring(command.length + config.prefix.length + space.length); // Take everything after the command

        if (commands[command]) {
            try {
                commands[command].process(client, message, suffix);
            } catch (err) {
                console.log("command: " + command + " failed.\n" + "Printing stack trace.");
                console.log(err + "\n" + "Finished stacktrace for failed " + command);
            }
        }
    }

});


  var commandFiles = fs.readdirSync('./Commands/');

  /* Voice Channel stuff. Maybe */



  client.login(authentication.token);
/*
if(command === "kick") {
// This command must be limited to mods and admins. In this example we just hardcode the role names.
// Please read on Array.some() to understand this bit:
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
return message.reply("Sorry, you don't have permissions to use this!");

// Let's first check if we have a member and if we can kick them!
// message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
let member = message.mentions.members.first();
if(!member)
return message.reply("Please mention a valid member of this server");
if(!member.kickable)
return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

// slice(1) removes the first part, which here should be the user mention!
let reason = args.slice(1).join(' ');
if(!reason)
return message.reply("Please indicate a reason for the kick!");

// Now, time for a swift kick in the nuts!
await member.kick(reason)
.catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

}

if(command === "ban") {
// Most of this command is identical to kick, except that here we'll only let admins do it.
// In the real world mods could ban too, but this is just an example, right? ;)
if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
return message.reply("Sorry, you don't have permissions to use this!");

let member = message.mentions.members.first();
if(!member)
return message.reply("Please mention a valid member of this server");
if(!member.bannable)
return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

let reason = args.slice(1).join(' ');
if(!reason)
return message.reply("Please indicate a reason for the ban!");

await member.ban(reason)
.catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
}

if(command === "purge") {
// This command removes all messages from all users in the channel, up to 100.

// get the delete count, as an actual number.
const deleteCount = parseInt(args[0], 10);

// Ooooh nice, combined conditions. <3
if(!deleteCount || deleteCount < 2 || deleteCount > 100)
return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

// So we get our messages, and delete them. Simple enough, right?
const fetched = await message.channel.fetchMessages({count: deleteCount});
message.channel.bulkDelete(fetched)
.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
}

if(command === "joinVoice") {
console.log("Panda was asked to join the voice channel!");
var voiceChannel = message.member.voiceChannel;
voiceChannel.join().catch(err => console.log(err));
}

if(command === "leaveVoice") {
console.log("You don't wish to hear Pandabot's sweet voice anymore?..");
var voiceChannel = member.bot.voiceChannel;
voiceChannel.leave();
}

if(command === "turnOff") {

console.log("Pandabot will be going away now.");
exit();
}

if(command === "soundboard") {
var voiceChannel = message.member.voiceChannel;
voiceChannel.join().then(connection => {
console.log("Pandabot has joined the voice channel!");
const dispatcher = connection.playFile('./Audio/PokemonStadium/Yes its Working.ashx')
dispatcher.on ("end", end => {
voiceChannel.leave();
console.log("Pandabot has left the voice channel!");
});
}).catch(err => console.log(err));
}

});
*/
