import { loadEnv, createConnString } from '@/utils';

const loadConfig = () => {
  try {
    loadEnv();
    console.log('[*] .env file loaded successfully');
  } catch (error) {
    console.error('[!] Failed to load the .env file:', error);
    process.exit(1); // Exit with error
  }

  const serverPort = process.env.SERVER_PORT;

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
    replicaSetName: replicaSetName
  });

  return {
    serverPort,
    connectionString,
    dbName
  };
};

export default loadConfig;
