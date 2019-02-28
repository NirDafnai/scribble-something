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

namespace ScribbleServer
{
    class Server
    {
        /// <summary>
        /// Server Class, responsible for handling clients and sending/receiving data.
        /// </summary>
        private static Thread server;
        private const int Port = 8820;
        private static TcpListener serverSocket = new TcpListener(IPAddress.Any, Port);
        private static bool online;
        private static List<Client> Clients = new List<Client>();
        private static List<User> Users = SqlManager.LoadUsers();
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
                        Clients[0].writeStream.WriteLine("send_canvas");
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
                    }
                        

                }
                List<Client> disconnectedClients = new List<Client>();
                foreach (var user in Clients)
                {
                    try
                    {
                        if (user.socket.Client.Poll(0, SelectMode.SelectRead))
                        {
                            byte[] checkConn = new byte[1];
                            if (user.socket.Client.Receive(checkConn, SocketFlags.Peek) == 0)
                            {
                                disconnectedClients.Add(user);
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
                                    if(ValidateLoginDetails(processedData[1], processedData[2]))
                                    {
                                        user.writeStream.WriteLine("successfulLogin");
                                    }
                                    else
                                    {
                                        user.writeStream.WriteLine("unsucessfulLogin");
                                    }
                                }
                                else
                                {
                                    foreach (Client writeUser in Clients)
                                    {
                                        if (!writeUser.Equals( user))
                                        {
                                            writeUser.writeStream.WriteLine(data);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e.ToString());
                        disconnectedClients.Add(user);
                    }

                }
                foreach (var disconnectedUser in disconnectedClients)
                {
                    Clients.Remove(disconnectedUser);
                    Console.WriteLine("Client disconnected: " + disconnectedUser.ip + ":" + disconnectedUser.port);
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
