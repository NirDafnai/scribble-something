using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Threading;
using System.Net;
using System.Net.Sockets;
using System.IO;
using EmailValidation;
using Newtonsoft.Json;

namespace ScribbleServer
{
    static class Server
    {
        /// <summary>
        /// Server Class, responsible for handling clients and sending/receiving data.
        /// </summary>
        private static Thread server;
        private const int Port = 8820;
        private static TcpListener serverSocket = new TcpListener(IPAddress.Any, Port);
        private static bool online;
        public static List<Client> Clients = new List<Client>();
        private static List<User> Users = SqlManager.LoadUsers();
        public static List<Lobby> Games = new List<Lobby>();
        public static List<Client> serverBrowserClients = new List<Client>();
        static void Main()
        {
            /*
             The main function that starts the GUI and runs the server thread. 
            */
            //Application.EnableVisualStyles();
            //Application.SetCompatibleTextRenderingDefault(false);
            server = new Thread(HandleClients);
            server.Start();
            //Application.Run(new ScribbleServerGUI());

        }
        static void HandleClients()
        {
            /*
             * Main function for clients, accepts new clients, receives their data and sends data accordingly.
             */
            online = true;
            serverSocket.Start();
            TcpClient client;
            StreamReader readStream;
            StreamWriter writeStream;
            List<Lobby> gamesToAdd = new List<Lobby>();
            List<Lobby> stoppedGames = new List<Lobby>();
            List<Client> disconnectedClients = new List<Client>();
            List<Client> clientsToRemove = new List<Client>();
            while (online)
            {
                if (serverSocket.Pending())
                {
                    client = serverSocket.AcceptTcpClient();
                    readStream = new StreamReader(client.GetStream());
                    writeStream = new StreamWriter(client.GetStream());
                    {
                        writeStream.AutoFlush = true;
                    }
                    Client c = new Client(client, readStream, writeStream);
                    Clients.Add(c);
                    Console.WriteLine("New client: " + c.ip + ":" + c.port);
                    if(Clients.Count() > 1)
                    {
                        /*
                         * Clients[0].writeStream.WriteLine("send_canvas");
                        string data = Clients[0].readStream.ReadLine();
                        string[] data1 = data.Split('&');
                        if (data1[0] == "canvas")
                        {
                            var modified_data = new List<String>();
                            modified_data = data1.ToList();
                            modified_data.RemoveAt(0);
                            data1 = modified_data.ToArray();
                            data = string.Join("", data1);
                            while (data.Length > 1024)
                            {
                                c.writeStream.WriteLine("dataparts&" + data.Substring(0, 1024));
                                c.readStream.ReadLine(); 
                                data = data.Substring(1024);
                            }
                            c.writeStream.WriteLine("dataparts&" + data);
                            c.readStream.ReadLine();
                            c.writeStream.WriteLine("end");
                        }
                        */
                    }
                        

                }
                
                for (int i = Clients.Count - 1; i >= 0; i--)
                {
                    Client user = Clients[i];
                    try
                    {
                        if (user.socket.Client.Poll(0, SelectMode.SelectRead))
                        {
                            byte[] checkConn = new byte[1];
                            if (user.socket.Client.Receive(checkConn, SocketFlags.Peek) == 0)
                            {
                                Clients.Remove(user);
                                serverBrowserClients.Remove(user);
                                Console.WriteLine(serverBrowserClients.Count());
                                Console.WriteLine("Client disconnected: " + user.ip + ":" + user.port);
                            }
                            else
                            {
                                string data = user.readStream.ReadLine();
                                string[] processedData = data.Split('&');
                                if (processedData[0] == "signup")
                                {
                                    string invalidParameters = "params&";
                                    User newUser = new User(processedData[1], processedData[2], processedData[3]);
                                    Console.WriteLine("is email valid: " + EmailValidator.Validate(newUser.email));
                                    if (!EmailValidator.Validate(newUser.email))
                                    {
                                        invalidParameters += "invalid_email&";
                                    }
                                    foreach (User userToCheck in Users)
                                    {
                                        if (userToCheck.email == newUser.email)
                                        {
                                            invalidParameters += "used_email&";
                                        }
                                        if (userToCheck.username == newUser.username)
                                        {
                                            invalidParameters += "used_username&";
                                        }
                                    }
                                    if (invalidParameters == "params&")
                                    {
                                        Users.Add(newUser);
                                        SqlManager.SaveUser(newUser);
                                        user.writeStream.WriteLine("signed_up");
                                    }
                                    else
                                    {
                                        invalidParameters = invalidParameters.Remove(invalidParameters.Length - 1);
                                        user.writeStream.WriteLine("errorsigningup" + "&" + invalidParameters);
                                    }
                                    /*
                                    foreach (var writeUser in Clients)
                                    {
                                        if (writeUser != user)
                                        {
                                            writeUser.writeStream.WriteLine(data);
                                        }
                                    }
                                    */
                                }
                                else if (processedData[0] == "login")
                                {
                                    if (ValidateLoginDetails(processedData[1], processedData[2]))
                                    {
                                        user.writeStream.WriteLine("successfulLogin&" + processedData[1]);
                                        user.username = processedData[1];
                                    }
                                    else
                                    {
                                        user.writeStream.WriteLine("unsucessfulLogin");
                                    }
                                }
                                else if (processedData[0] == "newGame")
                                {
                                    Lobby newLobby = new Lobby(user, processedData[1]);
                                    newLobby.playerCount = 1;
                                    Games.Add(newLobby);
                                    Clients.Remove(user);
                                    serverBrowserClients.Remove(user);
                                    string game_to_send = JsonConvert.SerializeObject(new string[] { newLobby.isPassworded.ToString(), newLobby.gameName, newLobby.playerCount.ToString(), newLobby.gameCreator.username, newLobby.gameID.ToString() });
                                    foreach (Client serverbrowserClient in serverBrowserClients)
                                    {
                                        serverbrowserClient.writeStream.WriteLine("newlyAddedGame&" + game_to_send);
                                    }
                                }
                                else if (processedData[0] == "joinGame")
                                {
                                    Lobby lobby = Games.Find(game_to_find => game_to_find.gameID.ToString() == processedData[1]);
                                    if (lobby.gameID.ToString() == processedData[1])
                                    {
                                        if (!lobby.isPassworded || (lobby.isPassworded && lobby.gamePassword == processedData[2]))
                                        {
                                            Console.WriteLine(lobby.gameID.ToString());
                                            List<string> users = new List<string>();
                                            List<Client> clients = lobby.clients.ToList();
                                            foreach (Client player in clients)
                                            {
                                                Console.WriteLine(player.username);
                                                if (player.username != lobby.gameCreator.username)
                                                    users.Add(player.username);
                                            }
                                            users.Add(user.username);
                                            user.writeStream.WriteLine("joinAccepted&" + lobby.gameCreator.username + "&" + JsonConvert.SerializeObject(users) + "&" + user.username);
                                            lobby.playerCount += 1;
                                            Console.WriteLine("New player count is: " + lobby.playerCount);
                                            lobby.newClientNotification(user);
                                            lobby.clients.Add(user);
                                            Clients.Remove(user);
                                            serverBrowserClients.Remove(user);
                                            Console.WriteLine(user.username + " join accepted");
                                        }
                                        else
                                        {
                                            user.writeStream.WriteLine("joinDenied");

                                        }
                                        continue;
                                    }
                                    // add shit
                                }
                                else if(processedData[0] == "getGames")
                                {
                                    Console.WriteLine("request to get games....");
                                    serverBrowserClients.Add(user);
                                    List<string[]> games_to_send = new List<string[]>();
                                    foreach(Lobby game in Games)
                                    {
                                        Console.WriteLine(game.ToString());
                                        games_to_send.Add(new string[] { game.isPassworded.ToString(), game.gameName, game.clients.Count().ToString(), game.gameCreator.username, game.gameID.ToString() });
                                    }

                                    user.writeStream.WriteLine("games&" + JsonConvert.SerializeObject(games_to_send));

                                    Console.WriteLine("sent");
                                }
                                else if (processedData[0] == "serverbrowserClosed")
                                {
                                    serverBrowserClients.Remove(user);
                                }

                            }
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e.ToString());
                        Clients.Remove(user);
                        serverBrowserClients.Remove(user);
                        Console.WriteLine(serverBrowserClients.Count());
                        Console.WriteLine("Client disconnected with error: " + user.ip + ":" + user.port);
                        Console.WriteLine(e);
                    }

                }

            }

        }
        static bool ValidateLoginDetails(string username, string password)
        {
            /// <summary>
            /// Gets the login details and validates that they exist in the database.
            /// </summary>
            /// <param name="username">String of the username</param>
            /// <param name="password">String of the password</param>
            /// <returns>Bool true if user credentials are correct and false otherwise.</returns>
            foreach (User userToCheck in Users)
            {
                if (userToCheck.username == username && userToCheck.password == password)
                {
                    return true;
                }
            }
            return false;
        }
    }
}
