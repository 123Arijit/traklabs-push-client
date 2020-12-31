const dotenv = require("dotenv")
const { Rabbit, BaseQueueHandler } = require("rabbit-queue")
const  WebSocket = require("ws")

dotenv.config()

const wss = new WebSocket.Server({ port: process.env.PORT })

const rabbit = new Rabbit(process.env.RABBIT_URL, { scheduledPublish: true })

class LoggerHandler extends BaseQueueHandler {
    handle({ msg, event, correlationId, startTime }) {
        let id = JSON.parse(msg.content.toString()).msg
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(id);
            }
        })
    }
}

rabbit.createQueue(process.env.RABBIT_QUEUE_NAME)

new LoggerHandler(process.env.RABBIT_QUEUE_NAME, rabbit, {
    retries: 3,
    retryDelay: 1000,
    logEnabled: false, //dont log queue processing time
    scope: 'SINGLETON', //can also be 'PROTOTYPE' to create a new instance every time
    createAndSubscribeToQueue: true
})
