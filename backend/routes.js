const express = require("express");
const routes = express.Router();
const debug = require("debug")("hip-app:routes");

module.exports = function (app) {
  const agentObj = require("./agent").getInstance(app);

  agentObj.create();

  routes.get("/", (req, res) => res.send({ hello: "world" }));
  routes.get("/users", (req, res) => res.send([]));
  routes.post("/users", (req, res) => res.send({ body: req.body }));
  routes.get("/myconversations", (req, res) => {
    res.send(agentObj.agent.getMyConversations());
  });
  routes.post("/acceptconversation", (req, res) => {
    // Accept all waiting conversations
    agentObj.agent.acceptWaitingConversations(req.body);
    res.send({ message: "success" });
  });
  routes.post("/sendmessage", (req, res) => {
    const { dialogId, message } = req.body;
    agentObj.agent.sendText(dialogId, `you said ${message}!`);
    res.send({ message: "success" });
  });
  return routes;
};
