import * as amqplib from "amqplib";
import * as dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE_NAME = "audit_logs";
const QUEUE_NAME = "login_events";

let connection: any = null;
let channel: any = null;

export interface LoginEvent {
  userId?: string;
  email: string;
  tenantId?: string;
  action: string;
  status: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  metadata?: any;
}

export async function connectRabbitMQ() {
  try {
    console.log(`Attempting to connect to RabbitMQ at ${RABBITMQ_URL}...`);

    const connectionPromise = amqplib.connect(RABBITMQ_URL);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });

    connection = await Promise.race([connectionPromise, timeoutPromise]);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "login");

    console.log("Connected to RabbitMQ successfully");

    connection.on("error", (err: Error) => {
      console.error("RabbitMQ connection error:", err);
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
      setTimeout(connectRabbitMQ, 5000);
    });

    return { connection, channel };
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    setTimeout(connectRabbitMQ, 5000);
    return { connection: null, channel: null };
  }
}

export async function publishLoginEvent(event: LoginEvent) {
  try {
    if (!channel) {
      await connectRabbitMQ();

      if (!channel) {
        console.error(
          "Cannot publish login event: RabbitMQ connection not available"
        );
        return false;
      }
    }

    console.log(event);

    const result = channel.publish(
      EXCHANGE_NAME,
      "login",
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    if (result) {
      console.log("Published event to RabbitMQ:", event.action, event.status);
      return true;
    } else {
      console.error("Failed to publish to RabbitMQ");
      return false;
    }
  } catch (error) {
    console.error("Failed to publish login event:", error);
    return false;
  }
}

export async function consumeLoginEvents(
  callback: (event: LoginEvent) => Promise<void>
) {
  try {
    if (!channel) {
      await connectRabbitMQ();

      if (!channel) {
        console.error(
          "Cannot consume login events: RabbitMQ connection not available"
        );
        setTimeout(() => consumeLoginEvents(callback), 5000);
        return;
      }
    }

    await channel.consume(
      QUEUE_NAME,
      async (msg: amqplib.ConsumeMessage | null) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString()) as LoginEvent;
            await callback(event);
            channel.ack(msg);
            console.log("Processed login event:", event.action, event.status);
          } catch (error) {
            console.error("Error processing RabbitMQ login event:", error);
            setTimeout(() => {
              try {
                channel.nack(msg, false, false);
              } catch (err) {
                console.error("Error nacking message:", err);
              }
            }, 1000);
          }
        }
      }
    );

    console.log("Consuming events from RabbitMQ queue");
  } catch (error) {
    console.error("Failed to set up login event consumption:", error);
    setTimeout(() => consumeLoginEvents(callback), 5000);
  }
}

export async function closeRabbitMQ() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log("RabbitMQ connection closed");
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error);
  }
}
