# board-game_ito

## Connect to project env vault

1. Connect to your project env vault (visit dotenv website and login to your account first).

   ```bash
   npx dotenv-vault@latest new vlt_your-project-vault
   ```

2. Pull the existing env vault.

   ```bash
   npx dotenv-vault@latest pull
   ```

3. Open the env vault in your local workspace.

   ```bash
   npx dotenv-vault@latest open
   ```

## Mongo DB & Docker Setup

1. Make sure `start.sh` and the other shell scripts in `/.docker` is executable.

   ```bash
   chmod +x .docker/keyfile.sh .docker/entrypoint.sh start.sh
   chmod +x keyfile.sh entrypoint.sh start.sh
   ```

2. Run the script.

   ```bash
   start.sh
   ```

3. (Optional): Open the Mongo DB shell (`mongosh`) in your bash terminal

   You can open the MongoDB shell (mongosh) in your bash terminal to interact with your Mongo DB instance after your script has started the MongoDB containers.
   **NOTE:** `${DATABASE_NAME}` should usually be "admin".

   ```bash
   cd ./docker

   docker exec -it mongo1 mongosh -u ${USERNAME} -p ${PASSWORD} --authenticationDatabase ${DATABASE_NAME}
   ```

   OR

   ```bash
   cd ./docker

   # Opens a bash shell inside the mongo1 container first
   docker exec -it mongo1 bash

   # Then run mongosh (Mongo Shell)
   mongosh -u ${USERNAME} -p ${PASSWORD} --authenticationDatabase ${DATABASE_NAME}
   ```

4. Testing connection string **as if** connecting from client

   You can login from the CLI as following:

   ```bash
   mongosh --username ${USERNAME} --password ${PASSWORD} --host mongo1
   ```

   OR

   ```bash
   # Just directly pass a connection string.
   mongosh "mongodb://${USERNAME}:${PASSWORD}@localhost/${DB_NAME}"
   ```

### Stop & Remove Docker Containers

Run the following script (Specify **`-v`** to also remove volumes):

```bash
# From .docker folder:
cd .docker
docker-compose down -v
```

OR

```bash
# From root folder:
docker-compose -f .docker/docker-compose.yaml down -v
```

## References

### Setup

#### React + Node + TypeScript

- [Initializing a Node Project](https://thinkster.io/tutorials/node-json-api/initializing-a-starter-node-project)
- [How to Create a React app with a Node backend](https://www.freecodecamp.org/news/how-to-create-a-react-app-with-a-node-backend-the-complete-guide/)
- [React - Typescript](https://react.dev/learn/typescript)

#### ESLint + Prettier

- [Improving Code Quality in React with ESLint, Prettier, and TypeScript](https://medium.com/globant/improving-code-quality-in-react-with-eslint-prettier-and-typescript-86635033d803)
- [How to set up ESLint and Prettier in React TypeScript 5 project? 2023](https://dev.to/quizzes4u/how-to-set-up-eslint-and-prettier-in-react-typescript-5-project-2023-hd6)
- [Setup a Node.js project with Typescript, ESLint, Prettier, Husky](https://gist.github.com/silver-xu/1dcceaa14c4f0253d9637d4811948437)

#### HTTP to HTTPS

- [Https on Localhost for Vite and React , Vue , Vanila , Svelte](https://www.youtube.com/watch?v=s2YxcPR_yhw)
- [How to Secure Your NodeJS App with HTTPS and SSL Certificates](https://medium.com/@anandam00/how-to-secure-your-nodejs-app-with-https-and-ssl-certificates-e3afcd4533e9)

### Unique ID

- [How to generate unique ID with node.js?](https://www.geeksforgeeks.org/how-to-generate-unique-id-with-node-js/)
- [UUID vs Crypto.randomUUID vs NanoID](https://medium.com/@matynelawani/uuid-vs-crypto-randomuuid-vs-nanoid-313e18144d8c)

### Routing

- [The Power Of CreateBrowserRouter: Optimizing Your React App's Navigation](https://www.dhiwise.com/post/the-power-of-createbrowserrouter-optimizing-your-react-app)

### Authentication

- [Authentication with React Router v6](https://blog.logrocket.com/authentication-react-router-v6/)

### Local Storage

- [How to refresh a React component when local storage has changed](https://michalkotowski.pl/writings/how-to-refresh-a-react-component-when-local-storage-has-changed)

### Chat Box

- [Building a Scrollable Chat Box with React](https://blog.bitsrc.io/building-a-scrollable-chat-box-with-react-b3848a4459fc)

### Socket.io

- [Real-Time Data Exchange: Building a Socket.io Backend Server in Node.js](https://medium.com/@ritikkhndelwal/real-time-data-exchange-building-a-socket-io-backend-server-in-node-js-aff454f13683)
- [Real-Time Chat in a Phaser Game with MongoDB and Socket.io](https://www.mongodb.com/developer/products/mongodb/real-time-chat-phaser-game-mongodb-socketio/)
- [Prevent multiple socket connections and events in React (useContext)](https://dev.to/bravemaster619/how-to-prevent-multiple-socket-connections-and-events-in-react-531d)
- [[Example] Building a chat app with Socket.io and React](https://dev.to/novu/building-a-chat-app-with-socketio-and-react-2edj)

### WebRTC

#### Basic Demo

- [A Comprehensive Guide to Integrating Socket.io with WebRTC](https://www.dhiwise.com/post/a-comprehensive-guide-to-integrating-socket-io-with-webrtc)
- [Develop a Video Chat App with WebRTC, Socket.IO, Express and React.](https://dev.to/eyitayoitalt/develop-a-video-chat-app-with-webrtc-socketio-express-and-react-3jc4)

#### Others

- [State of a MediaStreamTrack (for muted / unmuted state)](https://www.webrtc-developers.com/state-of-a-mediastreamtrack/#the-global-picture)

### Mongo DB

- [Changes to findOneAnd\* APIs in Node.js Driver 6.0.0](https://alexbevi.com/blog/2023/08/03/behavioral-changes-to-the-findoneand-star-family-of-apis-in-node-dot-js-driver-6-dot-0-0/)
