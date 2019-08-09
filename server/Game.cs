using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Timers;
using Timer = System.Timers.Timer;

namespace ScribbleServer
{
    class Game
    {
        public Lobby lobby;
        public bool gameRunning;
        public int rounds;
        private int maxRounds;
        private string chosenWord;
        public string hiddenWord;
        public int turn;
        public int counter;
        private int guessedPlayers;
        private Timer timer;
        public Game(Lobby _lobby)
        {
            this.lobby = _lobby;
            this.rounds = 1;
            this.maxRounds = 3;
            this.gameRunning = true;
            this.timer = new Timer();
            this.timer.Elapsed += new ElapsedEventHandler(this.timer_Tick);
            this.timer.Interval = 1000;
            this.counter = 91;
            this.turn = 0;
            this.guessedPlayers = 0;
            this.hiddenWord = "none";
        }
        /// <summary>
        /// Manages the game.
        /// </summary>
        public void game()
        {
            Client player;
            while (this.gameRunning && this.rounds <= this.maxRounds)
            {
                for (int i = this.lobby.clients.Count - 1; i >= 0; i--)
                {
                    try
                    {
                        player = this.lobby.clients[i];
                    }
                    catch
                    {
                        continue;
                    }
                    try
                    {
                        if (player.socket.Client.Poll(0, SelectMode.SelectRead))
                        {
                            byte[] checkConn = new byte[1];
                            if (player.socket.Client.Receive(checkConn, SocketFlags.Peek) == 0)
                            {
                                this.disconnectHandler(player, true);
                                if (!this.gameRunning) return;
                                else continue;
                            }
                            else
                            {
                                string data = player.readStream.ReadLine();
                                string[] processedData = data.Split('&');
                                if (processedData[0] == "chatmessage")
                                {
                                    if (processedData[2] == this.chosenWord)
                                    {
                                        int score = this.counter * 3;
                                        player.score += score;
                                        this.guessedPlayers++;
                                        for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
                                        {
                                            Client chatplayer = this.lobby.clients[a];
                                            if (chatplayer.Equals(player))
                                                chatplayer.writeStream.WriteLine("playerGuessedWord&" + processedData[1] + "&" + score.ToString() + "&" + processedData[2]);
                                            else chatplayer.writeStream.WriteLine("playerGuessedWord&" + processedData[1] + "&" + score.ToString());
                                        }
                                        if (this.guessedPlayers == this.lobby.clients.Count - 1) // win condition
                                        {
                                            const int drawerScore = 250;
                                            this.lobby.clients[turn].score += drawerScore;
                                            turn++;
                                            if (turn > this.lobby.clients.Count - 1)
                                            {
                                                this.rounds++;
                                                if (rounds > maxRounds)
                                                {
                                                   this.winHandler();
                                                   break;
                                                }
                                                else
                                                {
                                                    for (int f = this.lobby.clients.Count - 1; f >= 0; f--)
                                                    {
                                                        Client client = this.lobby.clients[f];
                                                        client.writeStream.WriteLine("newRound&" + this.rounds.ToString());
                                                    }
                                                    this.turn = 0;
                                                }

                                            }
                                            timer.Enabled = false;
                                            this.counter = 91;
                                            this.lobby.clients[turn].writeStream.WriteLine("youDraw&" + drawerScore.ToString() + "&" +JsonConvert.SerializeObject(this.getWords("words.txt", 3)));
                                            for (int f = this.lobby.clients.Count - 1; f >= 0; f--)
                                            {
                                                Client client = this.lobby.clients[f];
                                                if (!client.Equals(this.lobby.clients[turn]))
                                                    client.writeStream.WriteLine("newDrawer&" + drawerScore.ToString() + "&" + this.lobby.clients[turn].username + "&" + this.chosenWord);
                                            }
                                            this.guessedPlayers = 0;
                                            this.hiddenWord = "none";
                                        }
                                    }
                                    else
                                    {
                                        for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
                                        {
                                            Client chatplayer = this.lobby.clients[a];
                                            chatplayer.writeStream.WriteLine(
                                                "chatmessage&" + processedData[1] + ": " + processedData[2]);
                                        }
                                    }
                                }
                                else if (processedData[0] == "choseWord")
                                {
                                    this.chosenWord = processedData[2];
                                    this.hiddenWord = processedData[1];
                                    for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
                                    {
                                        Client client = this.lobby.clients[a];
                                        if (!client.Equals(player))
                                        {
                                            client.writeStream.WriteLine("chosenWord&" + processedData[1]);
                                        }
                                    }
                                    timer.Enabled = true;
                                }
                                else
                                {
                                    for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
                                    {
                                        Client client = this.lobby.clients[a];
                                        if (!client.Equals(player))
                                        {
                                            client.writeStream.WriteLine(data);
                                        }
                                    }
                                }
                            }

                        }
                    }
                    catch (Exception e)
                    {
                        this.disconnectHandler(player, true);
                        if (!this.gameRunning) return;
                        else continue;
                    }

                }
            }

            
        }
        /// <summary>
        /// When a client leaves/disconnected, this function will notify other clients and update things accordingly.
        /// </summary>
        /// <param name="disconnectedClient">The client that disconnected.</param>
        /// <param name="forceDisconnect">Was the disconnect a Ctrl+C/Alt+F4 and such or just a leave button.</param>
        public void disconnectHandler(Client disconnectedClient, bool forceDisconnect)
        {
            Server.ConnectedUsers.Remove(disconnectedClient);
            this.lobby.clients.Remove(disconnectedClient);
            if (!forceDisconnect)
                Server.Clients.Add(disconnectedClient);
            else
            {
                string timeStamp = Server.GetTimestamp(DateTime.Now);
                Server.logs.Items.Add("Client disconnected: " + disconnectedClient.ip + ":" + disconnectedClient.port);

            }
            this.lobby.playerCount--;
            if (this.lobby.playerCount == 0)
            {
                this.lobby.active = false;
                Server.Games.Remove(this.lobby);
                List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
                foreach (Client serverbrowserClient in serverBrowserClients)
                {
                    serverbrowserClient.writeStream.WriteLine("removeGame&" + this.lobby.gameID.ToString());
                }
                this.gameRunning = false;
                return;
            }
            else
            {
                if (this.lobby.playerCount == 1)
                {
                    this.lobby.clients[0].writeStream.WriteLine("backToLobby&" + this.lobby.clients[0].username);
                    timer.Enabled = false;
                    this.gameRunning = false;
                    this.lobby.gameOn = false;
                }
                else
                {
                    foreach (Client playerToSend in this.lobby.clients.ToList())
                    {
                        playerToSend.writeStream.WriteLine("playerLeft&" + disconnectedClient.username);
                    }

                    if (this.turn > this.lobby.clients.Count - 1)
                    {
                        this.turn = 0;
                        this.rounds++;
                        if (rounds > maxRounds)
                        {
                            this.winHandler();
                            this.gameRunning = false;
                            return;
                        }
                        else
                        {
                            for (int f = this.lobby.clients.Count - 1; f >= 0; f--)
                            {
                                Client client = this.lobby.clients[f];
                                client.writeStream.WriteLine("newRound&" + this.rounds.ToString());
                            }
                        }
                    }
                    timer.Enabled = false;
                    this.counter = 91;
                    this.lobby.clients[turn].writeStream.WriteLine("youDraw&" + "0" + "&" + JsonConvert.SerializeObject(this.getWords("words.txt", 3)));
                    for (int f = this.lobby.clients.Count - 1; f >= 0; f--)
                    {
                        Client client = this.lobby.clients[f];
                        if (!client.Equals(this.lobby.clients[turn]))
                            client.writeStream.WriteLine("newDrawer&" + "0" + "&" + this.lobby.clients[turn].username + "&" + this.chosenWord);
                    }
                    this.guessedPlayers = 0;
                    this.hiddenWord = "none";
                }
                List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
                foreach (Client clientToSend in serverBrowserClients)
                {
                    clientToSend.writeStream.WriteLine("playerCountUpdate&" + this.lobby.gameID.ToString() + "&" + this.lobby.playerCount.ToString());
                }
                if (this.lobby.gameCreator.Equals(disconnectedClient))
                {
                    bool valid = false;
                    Random rnd = new Random();
                    while (!valid)
                    {
                        int r = rnd.Next(this.lobby.clients.Count);
                        if (!this.lobby.gameCreator.Equals(this.lobby.clients[r]))
                        {
                            this.lobby.gameCreator = this.lobby.clients[r];
                            valid = true;
                        }
                    }
                }
            }
        }
        /// <summary>
        /// Gets random unique words from a file and returns a list with those words.
        /// </summary>
        /// <param name="filename">The name of the file with the words.</param>
        /// <param name="wordsAmount">How many words.</param>
        /// <returns>List with all the words</returns>
        public List<string> getWords(string filename, int wordsAmount = 3)
        {
            var wordFile = new List<string>(File.ReadAllLines("words.txt"));
            Random rnd = new Random();
            int r = rnd.Next(wordFile.Count);
            List<string> randomWords = new List<string>();
            randomWords.Add(wordFile[r]);
            bool valid = false;
            int count = 1;
            while (!valid && count != wordsAmount)
            {
                rnd = new Random();
                r = rnd.Next(wordFile.Count);
                if (!randomWords.Contains(wordFile[r]))
                {
                    randomWords.Add(wordFile[r]);
                    count++;
                }
            }
            return randomWords;
        }
        /// <summary>
        /// Called every second. This will limit rounds for 1:30.
        /// </summary>
        /// <param name="sender">The timer object that calls this function. This is used to stop the timer from within.</param>
        /// <param name="e">Event data.</param>
        private void timer_Tick(object sender, EventArgs e)
        {
            //Call method
            Timer timer = (Timer) sender;
            this.counter--;
            if (this.counter == 0)
            {
                int drawerScore = (int)(120 * (((float)this.guessedPlayers / (float)(this.lobby.clients.Count - 1)) + 1));
                if (guessedPlayers == 0) drawerScore = 0;
                this.lobby.clients[turn].score += drawerScore;
                turn++;
                if (turn > this.lobby.clients.Count - 1)
                {
                    this.rounds++;

                    if (rounds > maxRounds)
                    {
                        this.winHandler();
                        return;
                    }
                    else
                    {
                        for (int i = this.lobby.clients.Count - 1; i >= 0; i--)
                        {
                            Client player = this.lobby.clients[i];
                            player.writeStream.WriteLine("newRound&" + this.rounds.ToString());
                        }
                        this.turn = 0;
                    }

                }
                timer.Enabled = false;
                this.counter = 91;
                this.lobby.clients[turn].writeStream.WriteLine("youDraw&" + drawerScore.ToString() +  "&" + JsonConvert.SerializeObject(this.getWords("words.txt", 3)));
                for (int i = this.lobby.clients.Count - 1; i >= 0; i--)
                {
                    Client player = this.lobby.clients[i];
                    if (!player.Equals(this.lobby.clients[turn]))
                        player.writeStream.WriteLine("newDrawer&" + drawerScore.ToString() + "&" + this.lobby.clients[turn].username + "&" + this.chosenWord);
                }
                this.guessedPlayers = 0;
            }
        }
        /// <summary>
        /// When a win occurs this function handles it.
        /// </summary>
        private void winHandler()
        {
            this.lobby.clients[0].writeStream.WriteLine("sendWinner");
            string data = this.lobby.clients[0].readStream.ReadLine();
            if (data == "tie")
            {
                for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
                {
                    this.lobby.clients[a].writeStream.WriteLine("tie");
                }
            }
            else
            {
                string[] data1 = data.Split('&');
                for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
                {
                    this.lobby.clients[a].writeStream.WriteLine("win&" + data1[1] + "&" + data1[2]);
                }
            }
            this.gameRunning = false;
            timer.Enabled = false;
            List<string> players = new List<string>();
            for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
            {
                if(this.lobby.clients[a].username != this.lobby.gameCreator.username)
                    players.Add(this.lobby.clients[a].username);
            }
            players.Reverse();
            string playersString = JsonConvert.SerializeObject(players);
            for (int a = this.lobby.clients.Count - 1; a >= 0; a--)
            {
                if (this.lobby.clients[a].username == this.lobby.gameCreator.username)
                    this.lobby.clients[a].writeStream.WriteLine("users&" + playersString + "&" + this.lobby.gameCreator.username + "&" + this.lobby.clients[a].username + "&" + "true");
                else
                    this.lobby.clients[a].writeStream.WriteLine("users&" + playersString + "&" + this.lobby.gameCreator.username + "&" + this.lobby.clients[a].username + "&" + "false");
            }

            this.lobby.gameOn = false;
        }
    }
}
