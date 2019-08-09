using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ScribbleServer
{
    public partial class ScribbleServerGUI : Form
    {
        public ScribbleServerGUI()
        {
            InitializeComponent();
            Server.logs = serverLogs;
        }

        private void ScribbleServerGUI_Load(object sender, EventArgs e)
        {

        }

        private void startButton_Click(object sender, EventArgs e)
        {
            if (!Server.server.IsAlive)
            {
                startButton.Text = "Stop Server";
                Server.server = new Thread(Server.HandleClients);
                Server.server.Start();
                statusLabel.Text = "Online";
                statusLabel.ForeColor = Color.Green;
            }
            else
            {
                startButton.Text = "Start Server";
                Server.online = false;
                Server.serverSocket.Stop();
                Server.server.Abort();
                Server.Clients.Clear();
                Server.Users.Clear();
                foreach (var game in Server.Games)
                {
                    game.active = false;
                    game.gameThread.Abort();
                }
                foreach (Client client in Server.AllClients)
                {
                    try
                    {
                        client.writeStream.WriteLine("serverClosed");
                        client.readStream.Close();
                        client.writeStream.Close();
                        client.socket.Close();
                    }
                    catch
                    {

                    }
                }
                Server.Games.Clear();
                Server.serverBrowserClients.Clear();
                Server.ConnectedUsers.Clear();
                Server.AllClients.Clear();
                statusLabel.Text = "Offline";
                statusLabel.ForeColor = Color.Red;
                Console.WriteLine("Closed.");
            }
        }

        private void clearButton_Click(object sender, EventArgs e)
        {
            serverLogs.Items.Clear();
        }

        private void saveButton_Click(object sender, EventArgs e)
        {
            if (saveFileDialog1.ShowDialog() == DialogResult.OK)
            {
                string path = saveFileDialog1.FileName;
                using (System.IO.StreamWriter SaveFile = new System.IO.StreamWriter(path))
                {
                    foreach (var item in serverLogs.Items)
                        SaveFile.WriteLine(item.ToString());
                }
            }

        }

        private void ScribbleServerGUI_FormClosing(object sender, FormClosingEventArgs e)
        {
            Server.online = false;
            Server.serverSocket.Stop();
            Server.server.Abort();
            foreach (Client client in Server.AllClients)
            {
                try
                {
                    client.writeStream.WriteLine("serverClosed");
                    client.readStream.Close();
                    client.writeStream.Close();
                    client.socket.Close();
                }
                catch
                {

                }
            }
            Application.Exit();
        }

        private void usersInfoButton_Click(object sender, EventArgs e)
        {
            UsersView users_view = new UsersView();
            users_view.Show();
        }
    }
}
