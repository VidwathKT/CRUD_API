import express from 'express';
import { db } from '../Config/db.config';
import { router } from '../Routes/post.routes';
import { consumeRabbitMQ } from '../utils/rabbitmq';

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/v1/posts', router);

// db connection then server connection
db.then(async () => {
  // Start the server
  app.listen(7070, () => console.log('Server is listening on port 7070'));

  // Call consumeRabbitMQ after DB connection is successful
  await consumeRabbitMQ();
}).catch((error) => {
  console.error('Failed to connect to the database:', error);
});