const { Client, Util, MessageEmbed } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
require("dotenv").config();
require("./server.js");

const bot = new Client({
    disableMentions: "all"
});

const PREFIX = process.env.PREFIX;
const youtube = new YouTube(process.env.YTAPI_KEY);
const queue = new Map();

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => console.log(`[READY] ${bot.user.tag} has been successfully booted up!`));
bot.on("shardDisconnect", (event, id) => console.log(`[SHARD] Shard ${id} disconnected (${event.code}) ${event}, trying to reconnect...`));
bot.on("shardReconnecting", (id) => console.log(`[SHARD] Shard ${id} reconnecting...`));

bot.on("message", async (message) => { // eslint-disable-line
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
    const serverQueue = queue.get(message.guild.id);

    let command = message.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length);

    if (command === "help" || command === "cmd") {
        const helpembed = new MessageEmbed()
            .setColor("BLUE")
            .setAuthor(bot.user.tag, bot.user.displayAvatarURL())
            .setDescription(`
__**<a:LaalBatti:744025134310096997> Command list <a:LaalBatti:744025134310096997>**__
> <a:690963354197688320:744024219733590188> \`play\` : **\play [title/url]\**
> <a:690963354197688320:744024219733590188> \`search\` : **\search [title]\**
> <a:690963354197688320:744024219733590188> \`skip\` : **\To Skip The Song\**
> <a:690963354197688320:744024219733590188> \`stop\` : **\To Stop The Queue\**
> <a:690963354197688320:744024219733590188> \`pause\` : **\To Pause The Queue\**
> <a:690963354197688320:744024219733590188> \`resume\` : **\To Resume The Queue\**
> <a:690963354197688320:744024219733590188> \`nowplaying\` : **\To See The NowPlaying Song\**
> <a:690963354197688320:744024219733590188> \`queue\` : **\To See The Queue\**
> <a:690963354197688320:744024219733590188> \`volume\` : **\To See The Volume Of Song\**`)
            .setFooter("©️ 2020 Agents Op", "https://cdn.discordapp.com/attachments/739681480405418086/744036068994711612/Infinity-Discord-pfp-gold_grande.gif");
        message.channel.send(helpembed);
    }
  
  if (command === "invite" || command === "link") {
        const inviteembed = new MessageEmbed()
            .setColor("BLUE")
            .setAuthor(bot.user.tag, bot.user.displayAvatarURL())
            .setDescription(`
__**<a:LaalBatti:744025134310096997> Bot Invite Link <a:LaalBatti:744025134310096997>**__

> <a:690963354197688320:744024219733590188> [Invite link](https://discord.com/oauth2/authorize?client_id=743684711599177749&scope=bot&permissions=37092673)

__**<a:LaalBatti:744025134310096997> Support Server Link <a:LaalBatti:744025134310096997>**__

> <a:690963354197688320:744024219733590188> [Support Server Link](https://discord.gg/rZmaQcs)`)
            .setFooter("©️ 2020 Agents Op", "https://cdn.discordapp.com/attachments/739681480405418086/744036068994711612/Infinity-Discord-pfp-gold_grande.gif");
        message.channel.send(inviteembed);
    }
    if (command === "play" || command === "p") {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send("<a:No:744025064529461269> **I'm sorry, but you need to be in a voice channel to play a music!**");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) {
            return message.channel.send("<a:A_Warn2:739526745698467941> **Sorry, but I need a `CONNECT` permission to proceed!**");
        }
        if (!permissions.has("SPEAK")) {
            return message.channel.send("a:A_Warn2:739526745698467941> **Sorry, but I need a `SPEAK` permission to proceed!**");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return message.channel.send(`<a:ZeroForce_21:744025473037762642>  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var video = await youtube.getVideoByID(videos[0].id);
                    if (!video) return message.channel.send("<a:warning:740860058296123422>  **|**  I could not obtain any search results");
                } catch (err) {
                    console.error(err);
                    return message.channel.send("<a:warning:740860058296123422>  **|**  I could not obtain any search results");
                }
            }
            return handleVideo(video, message, voiceChannel);
        }
    }
    if (command === "search" || command === "sc") {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send("<a:No:744025064529461269> I'm sorry, but you need to be in a voice channel to play a music!");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) {
            return message.channel.send("<a:A_Warn2:739526745698467941> Sorry, but I need a **`CONNECT`** permission to proceed!");
        }
        if (!permissions.has("SPEAK")) {
            return message.channel.send("<a:A_Warn2:739526745698467941> Sorry, but I need a **`SPEAK`** permission to proceed!");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return message.channel.send(`<a:ZeroForce_21:744025473037762642>  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    let embedPlay = new MessageEmbed()
                        .setColor("BLUE")
                        .setAuthor("Search results", message.author.displayAvatarURL())
                        .setDescription(`${videos.map(video2 => `**\`${++index}\`  |**  ${video2.title}`).join("\n")}`)
                        .setFooter("Please choose one of the following 10 results, this embed will auto-deleted in 15 seconds");
                    // eslint-disable-next-line max-depth
                    message.channel.send(embedPlay).then(m => m.delete({
                        timeout: 15000
                    }))
                    try {
                        var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
                            max: 1,
                            time: 15000,
                            errors: ["time"]
                        });
                    } catch (err) {
                        console.error(err);
                        return message.channel.send("<a:warning:740860058296123422> The song selection time has expired in 15 seconds, the request has been canceled.");
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return message.channel.send("<a:warning:740860058296123422>  **|**  I could not obtain any search results");
                }
            }
            response.delete();
            return handleVideo(video, message, voiceChannel);
        }

    } else if (command === "skip") {
        if (!message.member.voice.channel) return message.channel.send("<a:No:744025064529461269> I'm sorry, but you need to be in a voice channel to skip a music!");
        if (!serverQueue) return message.channel.send("There is nothing playing that I could skip for you");
        serverQueue.connection.dispatcher.end("[runCmd] Skip command has been used");
        return message.channel.send("⏭️  **|**  I skip this song for you");

    } else if (command === "stop") {
        if (!message.member.voice.channel) return message.channel.send("I'm sorry but you need to be in a voice channel to play music!");
        if (!serverQueue) return message.channel.send("There is nothing playing that I could stop for you");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("[runCmd] Stop command has been used");
        return message.channel.send("⏹️  **|**  Deleting queues and leaving voice channel...");

    } else if (command === "volume" || command === "vol") {
        if (!message.member.voice.channel) return message.channel.send("I'm sorry, but you need to be in a voice channel to set a volume!");
        if (!serverQueue) return message.channel.send("There is nothing playing");
        if (!args[1]) return message.channel.send(`The current volume is: **\`${serverQueue.volume}%\`**`);
        if (isNaN(args[1]) || args[1] > 100) return message.channel.send("Volume only can be set in a range of **\`1\`** - **\`100\`**");
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 100);
        return message.channel.send(`I set the volume to: **\`${args[1]}%\`**`);

    } else if (command === "nowplaying" || command === "np") {
        if (!serverQueue) return message.channel.send("There is nothing playing");
        return message.channel.send(`<a:LaalBatti:744025134310096997>  **|**  Now Playing: **\`${serverQueue.songs[0].title}\`**`);

    } else if (command === "queue" || command === "q") {
        if (!serverQueue) return message.channel.send("There is nothing playing");
        let embedQueue = new MessageEmbed()
            .setColor("BLUE")
            .setAuthor("Song queue", message.author.displayAvatarURL())
            .setDescription(`${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}`)
            .setFooter(`• Now Playing: ${serverQueue.songs[0].title}`);
        return message.channel.send(embedQueue);

    } else if (command === "pause") {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send("⏸  **|**  Paused the music for you");
        }
        return message.channel.send("There is nothing playing");

    } else if (command === "resume") {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send("▶  **|**  Resumed the music for you");
        }
        return message.channel.send("There is nothing playing");
    } else if (command === "loop") {
        if (serverQueue) {
            serverQueue.loop = !serverQueue.loop;
            return message.channel.send(`🔁  **|**  Loop is **\`${serverQueue.loop === true ? "enabled" : "disabled"}\`**`);
        };
        return message.channel.send("There is nothing playing");
    }
});

async function handleVideo(video, message, voiceChannel, playlist = false) {
    const serverQueue = queue.get(message.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true,
            loop: false
        };
        queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`[ERROR] I could not join the voice channel, because: ${error}`);
            queue.delete(message.guild.id);
            return message.channel.send(`I could not join the voice channel, because: **\`${error}\`**`);
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        else return message.channel.send(`✅  **|**  **\`${song.title}\`** has been added to the queue`);
    }
    return;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on("finish", () => {
            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolume(serverQueue.volume / 100);

    serverQueue.textChannel.send({
        embed: {
            color: "BLUE",
            description: `🎶  **|**  Start Playing: **\`${song.title}\`**`
        }
    });
}

bot.login(process.env.BOT_TOKEN);
