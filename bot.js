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
const italic = "__";
const strikethrough = "~~";
const delimiter = " ";


client.commands = new Enmap();
client.config = config;

client.on("ready", () => {
    // Set the bot's 'game' status to the number of servers it is in
    client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setGame(`on ${client.guilds.size} servers`);
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
                var command = suffix.split(delimiter)[0];
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
    } // end of announce
}

// This call gets run everytime a message is put into chat
// We will pass the message along to the anonymous function and have it search for bot specific messages and respond accordingly.
client.on("message", async message => {

// Check if the message is for us (the bot)
    if (messageIsForBot(message)) {
        // Find the command given
        // Take the first block of text before a space and strip out the command prefix
        var command = message.content.split(delimiter)[0].substring(config.prefix.length);
        var suffix = message.content.substring(command.length + config.prefix.length + delimiter.length); // Take everything after the command

          // Check for any special command cases
        /*if (command === "help") {
            // The use used the 'help' commands
            // Show the list of all commands OR show help for a specific command
            // if another command was passed
            if (suffix) {
              //var helpCmd = suffix.split(delimiter).filter(function());
            } else {
                message.author.send(bold + "Available Commands:" + bold).then(function() {
                    var sortedCommands = Object.keys(commands).sort();
                    for (var i in sortedCommands) {
                        var batch = "";
                        var cmd = sortedCommands[i];
                        var info = bold + config.prefix + cmd + bold;
                        var usage = commands[cmd].usage;
                        if(usage) {
                            info += " " + usage;
                        }

                        var description = commands[cmd].description;
                        if (description instanceof Function) {
                            desription = description();
                        }

                        if (description) {
                            info += "\n\t" + description;
                        }

                        var newBatch = batch + "\n" + info;

                        if(newBatch.length > 1016) {
                            // limit message length
                            message.author.send(batch);
                            batch = info;
                        } else {
                            batch = newBatch;
                        }

                        if (batch.length > 0) {
                            message.author.send(batch);
                        }
                    } // loop through sorted commands
                }); // available commands' 'then' function
            }
        } else */if (commands[command]) {
            // It is not a special command. Use the comand
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
client.on("message", async message => {

//if (messageIsForBot(message)) { console.log("Its for me!");}

// This event will run on every single message received, from any channel or DM.

// It's good practice to ignore other bots. This also makes your bot ignore itself
// and not get into a spam loop (we call that "botception").
if(message.author.bot) return;

// Also good practice to ignore any message that does not start with our prefix,
// which is set in the configuration file.
if(message.content.indexOf(config.prefix) !== 0) return;

// Here we separate our "command" name, and our "arguments" for the command.
// e.g. if we have the message "+say Is this the real life?" , we'll get the following:
// command = say
// args = ["Is", "this", "the", "real", "life?"]
const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
const command = args.shift().toLowerCase();

// Let's go with a few common example commands! Feel free to delete or change those.

if(command === "ping") {
// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
const m = await message.channel.send("Ping?");
m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
}

if(command === "say") {
// makes the bot say something and delete the message. As an example, it's open to anyone to use.
// To get the "message" itself we join the `args` back into a string with spaces:
const sayMessage = args.join(" ");
// Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
message.delete().catch(O_o=>{});
// And we get the bot to say the thing:
message.channel.send(sayMessage);
}

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
