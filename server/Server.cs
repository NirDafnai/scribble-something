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
using System.Runtime.CompilerServices;
using EmailValidation;
using Newtonsoft.Json;
using System.Data.SQLite;
using System.Net.Mail;

namespace ScribbleServer
{
    static class Server
    {
        /// <summary>
        /// Server Class, responsible for handling clients and sending/receiving data.
        /// </summary>
        public static Thread server;
        private const int Port = 8820;
        public static TcpListener serverSocket = new TcpListener(IPAddress.Any, Port);
        public static bool online;
        public static List<Client> Clients = new List<Client>();
        public static List<User> Users;
        public static List<Lobby> Games = new List<Lobby>();
        public static List<Client> serverBrowserClients = new List<Client>();
        public static List<Client> ConnectedUsers = new List<Client>();
        public static List<Client> AllClients = new List<Client>();
        public static List<string[]> Codes = new List<string[]>();
        public static ListBox logs;
        static void Main()
        {
            /*
             The main function that starts the GUI and runs the server thread. 
            */
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            server = new Thread(HandleClients);
            Application.Run(new ScribbleServerGUI());
            //server.Start();

        }
        public static void HandleClients()
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
            try
            {
                SqlManager.sql_conn.Open();
            }
            catch
            {
            }
            Users = SqlManager.LoadUsers();
            Client user;
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
                    AllClients.Add(c);
                    string timeStamp = GetTimestamp(DateTime.Now);
                    logs.Items.Add(timeStamp + "New client: " + c.ip + ":" + c.port);
                        

                }
                
                for (int i = Clients.Count - 1; i >= 0; i--)
                {
                    try
                    {
                        user = Clients[i];

                    }
                    catch
                    {
                        continue;
                    }
                    try
                    {
                        if (user.socket.Client.Poll(0, SelectMode.SelectRead))
                        {
                            byte[] checkConn = new byte[1];
                            if (user.socket.Client.Receive(checkConn, SocketFlags.Peek) == 0)
                            {
                                Clients.Remove(user);
                                serverBrowserClients.Remove(user);
                                ConnectedUsers.Remove(user);
                                string timeStamp = GetTimestamp(DateTime.Now);
                                logs.Items.Add(timeStamp + "Client disconnected: " + user.ip + ":" + user.port);
                            }
                            else
                            {
                                string data = user.readStream.ReadLine();
                                string[] processedData = data.Split('&');
                                if (processedData[0] == "signup")
                                {
                                    string invalidParameters = "params&";
                                    User newUser = new User(processedData[1], processedData[2], processedData[3]);
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
                                }
                                else if (processedData[0] == "login")
                                {
                                    if (ValidateLoginDetails(processedData[1], processedData[2]))
                                    {
                                        bool exists = false;
                                        List<Client> connected_users = ConnectedUsers.ToList();
                                        foreach(Client connectedUser in connected_users)
                                        {
                                            if (connectedUser.username == processedData[1])
                                            {
                                                exists = true;
                                            }
                                        }
                                        if (!exists)
                                        {
                                            user.writeStream.WriteLine("successfulLogin&" + processedData[1]);
                                            user.username = processedData[1];
                                            ConnectedUsers.Add(user);
                                        }
                                        else
                                        {
                                            user.writeStream.WriteLine("alreadyLoggedin");
                                        }

                                    }
                                    else
                                    {
                                        user.writeStream.WriteLine("unsucessfulLogin");
                                    }
                                }
                                else if (processedData[0] == "resetPassword")
                                {
                                    SQLiteCommand cmd = new SQLiteCommand(SqlManager.sql_conn);
                                    cmd.CommandText = "SELECT count(*) FROM users WHERE username='" + processedData[1] + "'";
                                    int count = Convert.ToInt32(cmd.ExecuteScalar());
                                    if (count == 0)
                                    {
                                        user.writeStream.WriteLine("doesntExist");
                                    }
                                    else
                                    {
                                        user.writeStream.WriteLine("sendCode");
                                        cmd.CommandText = "SELECT * FROM users WHERE username='" + processedData[1] + "' LIMIT 1";
                                        SQLiteDataReader reader = cmd.ExecuteReader();
                                        reader.Read();
                                        string email = reader["email"].ToString();
                                        
                                        string randomCode = Guid.NewGuid().ToString().Substring(0, 6).ToUpper();
                                        Codes.Add(new string[] {randomCode, processedData[1]});
                                        MailMessage mail = new MailMessage();
                                        var fromAddress = new MailAddress("nsyncmail1@gmail.com", "Scribble Something");
                                        var toAddress = new MailAddress(email);
                                        string fromPassword = "mzmizmnbmzkzdkwm";
                                        const string subject = "Password Reset";
                                        string body = "Your reset code is: " + randomCode + "\nYour code expires in 5 minutes";
                                        var smtp = new SmtpClient("smtp.gmail.com", 587);
                                        smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                                        smtp.EnableSsl = true;
                                        smtp.UseDefaultCredentials = false;
                                        smtp.Credentials = new NetworkCredential(fromAddress.Address, fromPassword);
                                        using (var message = new MailMessage(fromAddress, toAddress)
                                        {
                                            Subject = subject,
                                            Body = body
                                        })
                                        {
                                            smtp.Send(message);
                                        }
                                        Task.Delay(300000).ContinueWith(t =>
                                        {
                                            int index = 0;
                                            for (int j = 0; j < Codes.Count; j++)
                                            {
                                                if (Codes[j][0] == randomCode)
                                                {
                                                    index = j;
                                                    break;
                                                }
                                            }

                                            Codes.RemoveAt(index);

                                        });
                                    }
                                }
                                else if (processedData[0] == "resetCode")
                                {
                                    string username;
                                    try
                                    {
                                        username = Codes.Find(x => x[0] == processedData[1])[1];
                                    }
                                    catch
                                    {
                                        username = null;
                                    }
                                    if (username == null)
                                    {
                                        user.writeStream.WriteLine("invalidCode");
                                    }
                                    else
                                    {
                                        SQLiteCommand cmd = new SQLiteCommand(SqlManager.sql_conn);
                                        cmd.CommandText =
                                            "UPDATE users SET password='" + processedData[2] + "' WHERE username='" +
                                            username + "'";
                                        cmd.ExecuteNonQuery();
                                        Users = SqlManager.LoadUsers();
                                        user.writeStream.WriteLine("changedPassword");
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

                                            if (lobby.gameOn)
                                            {
                                                List<string> users = new List<string>();
                                                List<Client> clients = lobby.clients.ToList();
                                                foreach (Client player in clients)
                                                {
                                                    users.Add(player.username + "|" + player.score);
                                                }
                                                users.Add(user.username + "|0");
                                                user.writeStream.WriteLine("joinAcceptedGame&" + user.username + "&" + lobby.clients[lobby.currentGame.turn].username + "&" + lobby.currentGame.hiddenWord + "&" + lobby.currentGame.rounds.ToString() + "&" + lobby.currentGame.counter.ToString() +  "&" + JsonConvert.SerializeObject(users));
                                                // START NEW THREAD AND SOCKET.
                                                new Thread(() =>
                                                {
                                                    Thread.CurrentThread.IsBackground = true;
                                                    TcpListener imageSocket = new TcpListener(IPAddress.Any, 5000);
                                                    imageSocket.Start();
                                                    lobby.clients[0].writeStream.WriteLine("send_canvas");
                                                    TcpClient imageSender = imageSocket.AcceptTcpClient();
                                                    StreamReader imageSenderRead = new StreamReader(imageSender.GetStream());
                                                    StreamWriter imageSenderWrite = new StreamWriter(imageSender.GetStream());
                                                    string canvas = imageSenderRead.ReadLine();
                                                    imageSender.Close();
                                                    while (canvas.Length > 1024)
                                                    {
                                                        user.writeStream.WriteLine("dataparts&" + canvas.Substring(0, 1024));
                                                        user.readStream.ReadLine();
                                                        canvas = canvas.Substring(1024);
                                                    }
                                                    user.writeStream.WriteLine("dataparts&" + canvas);
                                                    user.readStream.ReadLine();
                                                    user.writeStream.WriteLine("end");
                                                }).Start();
                                                
                                            }
                                            else
                                            {
                                                List<string> users = new List<string>();
                                                List<Client> clients = lobby.clients.ToList();
                                                foreach (Client player in clients)
                                                {
                                                    if (player.username != lobby.gameCreator.username)
                                                        users.Add(player.username);
                                                }
                                                users.Add(user.username);
                                                user.writeStream.WriteLine("joinAccepted&" + lobby.gameCreator.username + "&" + JsonConvert.SerializeObject(users) + "&" + user.username);
                                            }
                                            lobby.playerCount += 1;
                                            lobby.newClientNotification(user);
                                            lobby.clients.Add(user);
                                            Clients.Remove(user);
                                            serverBrowserClients.Remove(user);
                                        }
                                        else
                                        {
                                            user.writeStream.WriteLine("joinDenied");

                                        }
                                        continue;
                                    }
                                }
                                else if(processedData[0] == "getGames")
                                {
                                    serverBrowserClients.Add(user);
                                    List<string[]> games_to_send = new List<string[]>();
                                    foreach(Lobby game in Games)
                                    {
                                        games_to_send.Add(new string[] { game.isPassworded.ToString(), game.gameName, game.clients.Count().ToString(), game.gameCreator.username, game.gameID.ToString() });
                                    }

                                    user.writeStream.WriteLine("games&" + JsonConvert.SerializeObject(games_to_send));

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
                        Clients.Remove(user);
                        serverBrowserClients.Remove(user);
                        ConnectedUsers.Remove(user);
                        string timeStamp = GetTimestamp(DateTime.Now);
                        logs.Items.Add(timeStamp + "Client disconnected with error: " + user.ip + ":" + user.port);
                        logs.Items.Add(e);
                    }

                }

            }

        }
        public static String GetTimestamp(DateTime value)
        {
            return value.ToString("dd/MM/yyyy @ HH:mm:ss | ");
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
