using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.Net.Sockets;
using System.IO;
namespace ScribbleServer
{
    struct Client
    {
        public TcpClient socket { get; }
        public StreamReader readStream { get; }
        public StreamWriter writeStream { get; }
        public string ip { get; }
        public string port { get; }
        public Client(TcpClient _socket, StreamReader _readStream, StreamWriter _writeStream)
        {
            this.socket = _socket;
            this.readStream = _readStream;
            this.writeStream = _writeStream;
            this.ip = ((IPEndPoint)this.socket.Client.RemoteEndPoint).Address.ToString();
            this.port = ((IPEndPoint)this.socket.Client.RemoteEndPoint).Port.ToString();
        }
    }
}
