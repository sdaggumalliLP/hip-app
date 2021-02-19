const express = require("express");
const { route } = require("./app.js");
const routes = express.Router();

module.exports = function (app) {
  let agent_config = {};
  try {
    agent_config = require("./config/config.js")[process.env.LP_ACCOUNT][
      process.env.LP_USER
    ];
  } catch (ex) {
    log.warn(`[agent.js] Error loading config: ${ex}`);
  }
  const agentObj = require("./agent").getInstance(app, agent_config);

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
