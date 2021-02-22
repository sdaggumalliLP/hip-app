const Winston = require("winston");
const log = new Winston.Logger({
  name: "bot_agent_log",
  transports: [
    new Winston.transports.Console({
      timestamp: true,
      colorize: true,
      level: process.env.loglevel || "info",
    }),
  ],
});

const Bot = require("./bot/bot.js");

const WebSocket = require("ws");

const broadcast = (clients, message) => {
  clients &&
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
};

let instance = null;

class BotAgent {
  constructor(app) {
    this.app = app;
    this._agent = null;
    this.transferSkill = "277498214";
  }

  create() {
    /**
     * The agent bot starts in the default state ('ONLINE') and subscribes only to its own conversations
     *
     * Bot configuration is set via a config file (see config/example_config.js)
     * and environment variables LP_ACCOUNT and LP_USER
     *
     * transferSkill should be set to the ID of the skill you want the bot to transfer to
     *
     * @type {Bot}
     */
    this._agent = new Bot({});

    this._agent.on(Bot.const.CONNECTED, (data) => {
      log.info(`[agent.js] CONNECTED ${JSON.stringify(data)}`);
    });

    this._agent.on(Bot.const.ROUTING_NOTIFICATION, (data) => {
      log.info(`[agent.js] ROUTING_NOTIFICATION ${JSON.stringify(data)}`);

      broadcast(this.app.locals.clients, JSON.stringify(data));

      // Accept all waiting conversations
      // agent.acceptWaitingConversations(data);
    });

    this._agent.on(Bot.const.CONVERSATION_NOTIFICATION, (event) => {
      log.info(`[agent.js] CONVERSATION_NOTIFICATION ${JSON.stringify(event)}`);
    });

    this._agent.on(Bot.const.AGENT_STATE_NOTIFICATION, (event) => {
      log.info(`[agent.js] AGENT_STATE_NOTIFICATION ${JSON.stringify(event)}`);
    });

    this._agent.on(Bot.const.CONTENT_NOTIFICATION, (event) => {
      log.info(`[agent.js] CONTENT_NOTIFICATION ${JSON.stringify(event)}`);

      broadcast(this.app.locals.clients, JSON.stringify(event));
      // Respond to messages from the CONSUMER
      if (
        event.originatorMetadata.role === "CONSUMER" &&
        this._agent.getRole(
          this._agent.myConversations[event.dialogId].conversationDetails
        ) === "ASSIGNED_AGENT"
      ) {
        switch (event.message.toLowerCase()) {
          case "transfer":
            this._agent.sendText(
              event.dialogId,
              "transferring you to a new skill"
            );
            this._agent.transferConversation(event.dialogId, transferSkill);
            break;

          case "close":
            this._agent.closeConversation(event.dialogId);
            break;

          case "time":
            this._agent.sendText(event.dialogId, new Date().toTimeString());
            break;

          case "date":
            this._agent.sendText(event.dialogId, new Date().toDateString());
            break;

          case "online":
            this._agent.setAgentState({ availability: "ONLINE" }, () => {});
            break;

          case "back soon":
            this._agent.setAgentState({ availability: "BACK_SOON" }, () => {});
            break;

          case "away":
            this._agent.setAgentState({ availability: "AWAY" }, () => {});
            break;

          case "offline":
            this._agent.setAgentState({ availability: "OFFLINE" }, () => {});
            break;

          case "content":
            this._agent.sendRichContent(event.dialogId, {
              id: Math.floor(Math.random() * 100000).toString(),
              content: {
                type: "vertical",
                elements: [
                  {
                    type: "text",
                    text: "Product Name",
                    tooltip: "text tooltip",
                    style: {
                      bold: true,
                      size: "large",
                    },
                  },
                  {
                    type: "text",
                    text: "Product description",
                    tooltip: "text tooltip",
                  },
                  {
                    type: "button",
                    tooltip: "button tooltip",
                    title: "Add to cart",
                    click: {
                      actions: [
                        {
                          type: "link",
                          name: "Add to cart",
                          uri: "http://www.google.com",
                        },
                      ],
                    },
                  },
                ],
              },
            });
            break;

          default:
            // this._agent.sendText(event.dialogId, `you said ${event.message}!`);
            break;
        }
      }
    });

    this._agent.on(Bot.const.SOCKET_CLOSED, (event) => {
      log.info(`[agent.js] SOCKET_CLOSED ${JSON.stringify(event)}`);
    });

    this._agent.on(Bot.const.ERROR, (error) => {
      log.error(`[agent.js] ERROR ${JSON.stringify(error)}`);
    });
  }

  get agent() {
    return this._agent;
  }

  static getInstance(app) {
    if (!instance) {
      instance = new BotAgent(app);
    }

    return instance;
  }
}

module.exports = BotAgent;
