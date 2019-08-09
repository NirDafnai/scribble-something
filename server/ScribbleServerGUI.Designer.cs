namespace ScribbleServer
{
    partial class ScribbleServerGUI
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.startButton = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.statusLabel = new System.Windows.Forms.Label();
            this.usersInfoButton = new System.Windows.Forms.Button();
            this.serverLogs = new System.Windows.Forms.ListBox();
            this.saveButton = new System.Windows.Forms.Button();
            this.clearButton = new System.Windows.Forms.Button();
            this.saveFileDialog1 = new System.Windows.Forms.SaveFileDialog();
            this.SuspendLayout();
            // 
            // startButton
            // 
            this.startButton.Location = new System.Drawing.Point(204, 85);
            this.startButton.Name = "startButton";
            this.startButton.Size = new System.Drawing.Size(116, 39);
            this.startButton.TabIndex = 0;
            this.startButton.Text = "Start Server";
            this.startButton.UseVisualStyleBackColor = true;
            this.startButton.Click += new System.EventHandler(this.startButton_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Arial", 18F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(133, 28);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(171, 27);
            this.label1.TabIndex = 1;
            this.label1.Text = "Server Status: ";
            // 
            // statusLabel
            // 
            this.statusLabel.AutoSize = true;
            this.statusLabel.Font = new System.Drawing.Font("Microsoft Sans Serif", 15F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.statusLabel.ForeColor = System.Drawing.Color.Crimson;
            this.statusLabel.Location = new System.Drawing.Point(300, 30);
            this.statusLabel.Name = "statusLabel";
            this.statusLabel.Size = new System.Drawing.Size(68, 25);
            this.statusLabel.TabIndex = 2;
            this.statusLabel.Text = "Offline";
            // 
            // usersInfoButton
            // 
            this.usersInfoButton.Location = new System.Drawing.Point(204, 131);
            this.usersInfoButton.Name = "usersInfoButton";
            this.usersInfoButton.Size = new System.Drawing.Size(116, 39);
            this.usersInfoButton.TabIndex = 3;
            this.usersInfoButton.Text = "Users Info";
            this.usersInfoButton.UseVisualStyleBackColor = true;
            this.usersInfoButton.Click += new System.EventHandler(this.usersInfoButton_Click);
            // 
            // serverLogs
            // 
            this.serverLogs.ColumnWidth = 30;
            this.serverLogs.FormattingEnabled = true;
            this.serverLogs.HorizontalScrollbar = true;
            this.serverLogs.Location = new System.Drawing.Point(12, 199);
            this.serverLogs.Name = "serverLogs";
            this.serverLogs.Size = new System.Drawing.Size(503, 238);
            this.serverLogs.TabIndex = 4;
            // 
            // saveButton
            // 
            this.saveButton.Location = new System.Drawing.Point(437, 170);
            this.saveButton.Name = "saveButton";
            this.saveButton.Size = new System.Drawing.Size(75, 23);
            this.saveButton.TabIndex = 5;
            this.saveButton.Text = "Save To File";
            this.saveButton.UseVisualStyleBackColor = true;
            this.saveButton.Click += new System.EventHandler(this.saveButton_Click);
            // 
            // clearButton
            // 
            this.clearButton.Location = new System.Drawing.Point(12, 170);
            this.clearButton.Name = "clearButton";
            this.clearButton.Size = new System.Drawing.Size(75, 23);
            this.clearButton.TabIndex = 6;
            this.clearButton.Text = "Clear";
            this.clearButton.UseVisualStyleBackColor = true;
            this.clearButton.Click += new System.EventHandler(this.clearButton_Click);
            // 
            // saveFileDialog1
            // 
            this.saveFileDialog1.DefaultExt = "txt";
            this.saveFileDialog1.FileName = "*.txt";
            this.saveFileDialog1.Filter = "Text files (*.txt)|*.txt";
            this.saveFileDialog1.ShowHelp = true;
            this.saveFileDialog1.Title = "Save log text file";
            // 
            // ScribbleServerGUI
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(524, 450);
            this.Controls.Add(this.clearButton);
            this.Controls.Add(this.saveButton);
            this.Controls.Add(this.serverLogs);
            this.Controls.Add(this.usersInfoButton);
            this.Controls.Add(this.statusLabel);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.startButton);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
            this.MaximizeBox = false;
            this.Name = "ScribbleServerGUI";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Server";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.ScribbleServerGUI_FormClosing);
            this.Load += new System.EventHandler(this.ScribbleServerGUI_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button startButton;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label statusLabel;
        private System.Windows.Forms.Button usersInfoButton;
        private System.Windows.Forms.ListBox serverLogs;
        private System.Windows.Forms.Button saveButton;
        private System.Windows.Forms.Button clearButton;
        private System.Windows.Forms.SaveFileDialog saveFileDialog1;
    }
}

