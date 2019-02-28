﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Configuration;
using System.Data;
using System.Data.SQLite;
using Dapper;

namespace ScribbleServer
{
    static class SqlManager
    {
        /// <summary>
        /// Responsible for handling the database file's data and adding to it.
        /// </summary>
        public static SQLiteConnection sql_conn = new SQLiteConnection("Data Source=.\\scribbleDB.db;Version=3;");

        public static List<User> LoadUsers()
        {
            /// <summary>
            /// Gets the userlist from the user table in the database and returns it.
            /// </summary>
            /// <returns>List of Users.</returns>
            using (IDbConnection cnn = new SQLiteConnection(LoadConnectionString()))
            {
                var output = cnn.Query<User>("select * from users", new DynamicParameters());
                return output.ToList();
            }
        }

        public static void SaveUser(User user)
        {
            /// <summary>
            /// Adds user to the database.
            /// </summary>
            /// <param name="user"></param>
            using (IDbConnection cnn = new SQLiteConnection(LoadConnectionString()))
            {
                Console.WriteLine("executed");
                cnn.Execute("insert into users (username, email, password) values (@username, @email, @password)", user);
                
            }
        }

        private static string LoadConnectionString(string id = "Default")
        {
            /// <summary>
            /// Returns the connection string for the database file.
            /// </summary>
            /// <param name="id"></param>
            /// <returns></returns>
            return ConfigurationManager.ConnectionStrings[id].ConnectionString;
        }
    }
}
