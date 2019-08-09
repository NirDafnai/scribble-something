using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Net.Sockets;
using Newtonsoft.Json;

namespace ScribbleServer
{
    /// <summary>
    /// The class that is responsible for handling the lobby, where all players join and wait. This class redirects later to a game.
    /// </summary>
    class Lobby
    {
        public string gameName;
        public Client gameCreator;
        public List<Client> clients;
        public Guid gameID;
        public Thread gameThread { get; set; }
        public bool isPassworded;
        public string gamePassword = "";
        public bool gameStarted;
        public bool active;
        public int playerCount;
        public bool gameOn;
        public Game currentGame;
        public List<Client> clientsToAdd;

        public Lobby(Client game_creator, string gameName)
        {
            this.gameStarted = false;
            this.gameCreator = game_creator;
            this.gameName = gameName;
            this.clients = new List<Client> { this.gameCreator };
            this.gameID = Guid.NewGuid();
            this.isPassworded = false;
            this.active = true;
            this.clientsToAdd = new List<Client>();
            this.gameThread = new Thread(this.lobby);
            this.gameOn = false;
            this.gameThread.Start();
        }
        /// <summary>
        /// The thread runs on this function. It manages the lobby and all communication between the players and the lobby.
        /// </summary>
        public void lobby()
        {
            List<Client> disconnectedClients = new List<Client>();
            List<Client> leftUsers = new List<Client>();
            Client client;
            while (this.active)
            {
                for (int i = this.clients.Count - 1; i >= 0; i--)
                {
                    try
                    {
                        client = this.clients[i];
                    }
                    catch
                    {
                        continue;
                    }
                    try
                    {
                        if (client.socket.Client.Poll(0, SelectMode.SelectRead))
                        {
                            byte[] checkConn = new byte[1];
                            if (client.socket.Client.Receive(checkConn, SocketFlags.Peek) == 0)
                            {
                                disconnectHandler(client, true);
                                continue;
                            }
                            else
                            {
                                string data = client.readStream.ReadLine();
                                string[] processedData = data.Split('&');
                                if (processedData[0] == "exitLobby")
                                {
                                    disconnectHandler(client, false);
                                    continue;
                                }
                                else if (processedData[0] == "updateLobbyData")
                                {
                                    string lobbyName = processedData[1];
                                    string passworded = processedData[2];
                                    string password = processedData[3];
                                    this.gameName = lobbyName;
                                    if (passworded == "true")
                                    {
                                        this.isPassworded = true;
                                    }
                                    else
                                    {
                                        this.isPassworded = false;
                                    }
                                    this.gamePassword = password;
                                    List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
                                    foreach (Client serverBrowserClient in serverBrowserClients)
                                    {
                                        serverBrowserClient.writeStream.WriteLine("newLobbyData&" + this.gameID.ToString() + "&" + lobbyName + "&" + passworded);
                                    }
                                }
                                else if (processedData[0] == "kickPlayer")
                                {
                                    List<Client> clients = this.clients.ToList();
                                    foreach (Client player in this.clients)
                                    {
                                        if (player.username == processedData[1])
                                        {
                                            player.writeStream.WriteLine("kicked");
                                            this.clients.Remove(player);
                                            Server.Clients.Add(player);
                                            this.playerCount--;
                                            List<Client> clientsToWrite = this.clients.ToList();
                                            foreach (Client user in clientsToWrite)
                                            {
                                                if (!user.Equals(player))
                                                {
                                                    user.writeStream.WriteLine("userLeft&" + player.username);
                                                }
                                            }
                                            List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
                                            foreach (Client clientToSend in serverBrowserClients)
                                            {
                                                clientToSend.writeStream.WriteLine("playerCountUpdate&" + this.gameID.ToString() + "&" + this.playerCount.ToString());
                                            }
                                            break;
                                        }
                                    }
                                }
                                else if (processedData[0] == "startGame")
                                {
                                    List<string> players = new List<string>();
                                    for (int a = this.clients.Count - 1; a >= 0; a--)
                                    {
                                        players.Add(this.clients[a].username);
                                    }
                                    players.Reverse();
                                    string playersString = JsonConvert.SerializeObject(players);
                                    for (int a = this.clients.Count - 1; a >= 0; a--)
                                    {
                                        Client player = this.clients[a];
                                        player.score = 0;
                                        if (!player.Equals(client))
                                            player.writeStream.WriteLine("startGame&" + player.username + "&" + playersString);
                                    }
                                    this.gameOn = true;
                                    Game game = new Game(this);
                                    currentGame = game;
                                    Thread.Sleep(30);
                                    client.writeStream.WriteLine("players&" + client.username + "&" + playersString + "&" + JsonConvert.SerializeObject(game.getWords("words.txt", 3)));
                                    game.game();
                                }
                                
                            }
                        }

                    }
                    catch (Exception e)
                    {
                        disconnectHandler(client, true);
                        continue;
                    }
                }
            }

        }
        /// <summary>
        /// Sends a notification to all clients of a lobby that a new player joined.
        /// </summary>
        /// <param name="client">The client that joined.</param>
        public void newClientNotification(Client client)
        {

            List<Client> clients = this.clients.ToList();
            foreach (Client clientToSend in clients)
            {
                if (!clientToSend.Equals(client))
                    clientToSend.writeStream.WriteLine("newUser&" + client.username);
            }
            List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
            foreach (Client clientToSend in serverBrowserClients)
            {
                if (!clientToSend.Equals(client))
                    clientToSend.writeStream.WriteLine("playerCountUpdate&" + this.gameID.ToString() + "&" + this.playerCount.ToString());
            }
        }
        /// <summary>
        /// When a client leaves/disconnected, this function will notify other clients and update things accordingly.
        /// </summary>
        /// <param name="disconnectedClient">The client that disconnected.</param>
        /// <param name="forceDisconnect">Was the disconnect a Ctrl+C/Alt+F4 and such or just a leave button.</param>
        public void disconnectHandler(Client disconnectedClient, bool forceDisconnect)
        {
            try
            {
                Server.ConnectedUsers.Remove(disconnectedClient);
                this.clients.Remove(disconnectedClient);
                if (!forceDisconnect)
                    Server.Clients.Add(disconnectedClient);
                else
                {
                    string timeStamp = Server.GetTimestamp(DateTime.Now);
                    Server.logs.Items.Add("Client disconnected: " + disconnectedClient.ip + ":" + disconnectedClient.port);
                }
                this.playerCount--;
                if (this.playerCount == 0)
                {
                    this.active = false;
                    Server.Games.Remove(this);
                    List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
                    foreach (Client serverbrowserClient in serverBrowserClients)
                    {
                        serverbrowserClient.writeStream.WriteLine("removeGame&" + this.gameID.ToString());
                    }
                }
                else
                {
                    List<Client> serverBrowserClients = Server.serverBrowserClients.ToList();
                    foreach (Client clientToSend in serverBrowserClients)
                    {
                        clientToSend.writeStream.WriteLine("playerCountUpdate&" + this.gameID.ToString() + "&" + this.playerCount.ToString());
                    }
                    if (this.gameCreator.Equals(disconnectedClient))
                    {
                        bool valid = false;
                        Random rnd = new Random();
                        while (!valid)
                        {
                            int r = rnd.Next(this.clients.Count);
                            if (!this.gameCreator.Equals(this.clients[r]))
                            {
                                this.gameCreator = this.clients[r];
                                valid = true;
                            }
                        }
                        this.gameCreator.writeStream.WriteLine("youAreNewCreator&" + disconnectedClient.username);
                        List<Client> clientsToWrite = this.clients.ToList();
                        foreach (Client player in clientsToWrite)
                        {
                            if (!player.Equals(gameCreator) && !player.Equals(disconnectedClient))
                            {
                                player.writeStream.WriteLine("newCreator&" + gameCreator.username + "&" + disconnectedClient.username);
                            }

                        }

                    }
                    else
                    {
                        List<Client> clientsToWrite = this.clients.ToList();
                        foreach (Client player in clientsToWrite)
                        {
                            if (!player.Equals(disconnectedClient))
                            {
                                player.writeStream.WriteLine("userLeft&" + disconnectedClient.username);
                            }
                        }
                    }
                }
            }
            catch
            {

            }

        }
        public override string ToString()
        {
            return "Lobby name: " + this.gameName + "\n"
                + "Lobby Creator: " + this.gameCreator.username + "\n"
                + "Is Passworded?: " + this.isPassworded + "\n"; 
        }
    }
}
