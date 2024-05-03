const express = require("express");
const app = express();
const config = require("dotenv").config().parsed;
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bcrypt = require("bcrypt");

const users = [
  {
    login: "otrijka",
    password: "$2b$10$/DJa57BeOrG/RqwrgQVWf.iVhga/X2qedWaKQQ/2pU5HTX/B6rOii",
    secret: "NFRFAPRZKZNWIOKXJ5EEOMZZFARUSLBDGZQW4SC3JBJCYJJVHA3A",
  },
];
const PORT = config.PORT || 3001;

app.use(express.json());

app.listen(config.PORT, () =>
  console.log(`Server is listening on port ${PORT}`)
);

app.post("/register", async (req, res) => {
  const { login, password } = req.body;
  try {
    const secret = speakeasy.generateSecret({
      issuer: "lab2",
      name: login,
      length: 20,
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({
      login,
      password: hashedPassword,
      secret: secret.base32,
    });
    console.log(users);
    const qrcode = await QRCode.toDataURL(secret.otpauth_url);
    console.log(secret.base32);
    console.log(secret.otpauth_url);
    res.send(`<img src="${qrcode}">`);
  } catch (e) {
    console.log(e);
    res.status(500);
  }
});

app.post("/verify", async (req, res) => {
  const { login, password, token } = req.body;

  const user = users.find((u) => u.login === login);
  if (!user) return res.json(400);
  const passIsValid = await bcrypt.compare(password, user.password);
  if (!passIsValid) {
    return res.status(400).json("Wrong password");
  }
  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: "base32",
    token,
  });

  if (verified) {
    return res.status(200).json("verified");
  } else {
    return res.status(400).json("wrong otp");
  }
});
