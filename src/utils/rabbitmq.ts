import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export async function consumeRabbitMQ() {
  let connection:any;
  let channel:any;

  try {
    // Attempt to connect to RabbitMQ with a fallback to localhost
    connection = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ for consumption');

    // Define the exchange, queue, and routing key
    const exchange = 'userExchange';
    const queue = 'rabbit';
    const routingKey = 'userRoutingKey';

    // Assert exchange and queue to make sure they exist
    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange with the routing key
    await channel.bindQueue(queue, exchange, routingKey);

    // Consume messages from the queue
    channel.consume(
      queue,
      (msg:any) => {
        if (msg) {
          try {
            // Parse the message content
            const messageContent = JSON.parse(msg.content.toString());
            console.log('Received message:', messageContent);

            // Acknowledge the message
            channel.ack(msg);
          } catch (err) {
            console.error('Error parsing message:', err);
            channel.nack(msg); // Negative acknowledgment on parse failure
          }
        }
      },
      { noAck: false } // Ensure manual acknowledgment
    );

    console.log(`Waiting for messages in queue: ${queue}`);

  } catch (error) {
    console.error('Error in RabbitMQ receiver:', error);
  }

  // Gracefully handle shutdown signals to close connection and channel properly
  process.on('SIGINT', async () => {
    console.log('Shutting down RabbitMQ consumer...');
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('RabbitMQ connection closed.');
    process.exit(0);
  });
}