import { createConnString } from './utils';

const loadConfig = () => {
  // try {
  //     // Adjust the path as necessary based on your project structure
  //     const envPath = path.resolve(__dirname, '../../../.env/.env')
  //     const result = dotenv.config({ path: envPath })
  //     // Error
  //     if (result.error) {
  //         throw result.error
  //         // process.exit(1); // Optionally exit if the config is critical
  //     }

  //     console.log('[*] .env file loaded successfully')
  // } catch (error) {
  //     console.error('[!] Failed to load the .env file:', error)
  //     process.exit(1) // Exit with error
  // }

  const serverPort =
    typeof process.env.SERVER_PORT === 'string'
      ? parseInt(process.env.SERVER_PORT, 10)
      : process.env.SERVER_PORT;

  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  const hostUrl = process.env.MONGO_HOST_URL;
  const dbName = process.env.MONGO_DB_NAME;
  const replicaSetName = process.env.REPLICA_SET_NAME;

  const connectionString: string = createConnString({
    username: username,
    password: password,
    hostUrl: hostUrl,
    dbName: dbName,
    replicaSetName: replicaSetName,
  });

  return {
    serverPort,
    connectionString,
    dbName,
  };
};

export default loadConfig;
