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
namespace ScribbleServer
{
    class Server
    {
        private static Thread server;
        public const int Port = 8820;
        private static TcpListener serverSocket = new TcpListener(IPAddress.Any, Port);
        private static bool online;
        public static List<Client> Users = new List<Client>();
        static void Main()
        {
            //Application.EnableVisualStyles();
            //Application.SetCompatibleTextRenderingDefault(false);
            server = new Thread(HandleClients);
            server.Start();
            //Application.Run(new ScribbleServerGUI());

        }
        static void HandleClients()
        {
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
                    Users.Add(c);
                    Console.WriteLine("New client: " + c.ip + ":" + c.port);
                    if(Users.Count() > 1)
                    {
                        Users[0].writeStream.WriteLine("send_board");
                        string data = Users[0].readStream.ReadLine();
                        while (data.Length > 1024)
                        {
                            c.writeStream.WriteLine("dataparts&"+ data.Substring(0, 1024));
                            c.readStream.ReadLine();
                            data = data.Substring(1024);
                        }
                        c.writeStream.WriteLine("dataparts&" + data);
                        c.readStream.ReadLine();
                        c.writeStream.WriteLine("end");
                    }
                }
                List<Client> disconnectedUsers = new List<Client>();
                foreach (var user in Users)
                {
                    try
                    {
                        if (user.socket.Client.Poll(0, SelectMode.SelectRead))
                        {
                            byte[] checkConn = new byte[1];
                            if (user.socket.Client.Receive(checkConn, SocketFlags.Peek) == 0)
                            {
                                disconnectedUsers.Add(user);
                            }
                            else
                            {
                                string data = user.readStream.ReadLine();
                                foreach (var writeUser in Users)
                                {
                                    if (writeUser != user)
                                    {
                                        writeUser.writeStream.WriteLine(data);
                                    }
                                }
                            }
                        }
                    }
                    catch
                    {
                        disconnectedUsers.Add(user);
                    }

                }
                foreach (var disconnectedUser in disconnectedUsers)
                {
                    Users.Remove(disconnectedUser);
                    Console.WriteLine("Client disconnected: " + disconnectedUser.ip + ":" + disconnectedUser.port);
                }

            }

        }
    }
}
