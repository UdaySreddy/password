let express = require("express");
let path = require("path");
let sqlite3 = require("sqlite3");
let sqlite = require("sqlite");
let { open } = require("sqlite");
let bcrypt = require("bcrypt");
let app = express();
app.use(express.json());
let dataBase = path.join(__dirname, "userData.db");
let db = null;
let initiateDB = async () => {
  try {
    db = await open({
      filename: dataBase,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server http://localhost:3000 is running...");
    });
  } catch (e) {
    console.log(`server error:${e.message}`);
    process.exit(1);
  }
};
initiateDB();

//create user

app.post("/register", async (request, response) => {
  const { username, name, gender, location, password } = request.body;

  let hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  let query1 = `select * from user where 
    username = "${username}";`;
  let userdata = await db.get(query1);
  if (userdata !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (userdata === undefined && password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(200);
    let query2 = `insert into user (username,name,gender,location,password)
         values ("${username}","${name}","${gender}","${location}","${hashedPassword}");`;
    await db.run(query2);
    response.send("User created successfully");
  }
});

//logi user

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let query3 = `select * from user where
    username = "${username}";`;
  let dbuser = await db.get(query3);

  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let matchPassword = await bcrypt.compare(password, dbuser.password);

    if (matchPassword) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let query4 = `select * from user 
    where username= "${username}";`;
  let data = await db.get(query4);
  let hashedP = bcrypt.hash(newPassword, 10);
  let match = await bcrypt.compare(oldPassword, data.password);
  let query5 = `update user set
                password = "${hashedP}" where
                username = "${username}";`;
  if (match && newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (match && newPassword.length > 5) {
    await db.run(query5);
    response.status(200);
    response.send("Password updated");
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

//delete
app.delete("/delete", async (request, response) => {
  let { username } = request.query;
  let query6 = `delete from user where
    username ="${username}";`;
  await db.run(query6);
  response.send("deleted");
});

module.exports = app;
