type CreateConnStringArgs = {
  username?: string;
  password?: string;
  hostUrl?: string;
  dbName?: string;
  replicaSetName?: string;
  queries?: string;
};

export const createConnString = ({
  username,
  password,
  hostUrl,
  dbName,
  replicaSetName,
  queries
}: CreateConnStringArgs): string => {
  // Prepare a connection string
  let connectionString = `mongodb://`;

  // Append username and password if exists
  if (username && password) connectionString += `${username}:${password}@`;
  connectionString += hostUrl;
  // Append database name if exists
  if (dbName) connectionString += `/${dbName}`;
  // Append replica set name if exists
  if (replicaSetName) connectionString += `?replicaSet=${replicaSetName}`;
  // Append queries if exists
  if (queries) {
    connectionString += `&${queries}`;
  }

  return connectionString;
};

type CreateConnStringAtlasArgs = {
  username?: string;
  password?: string;
  hostUrl?: string;
  dbName?: string;
  queries?: string;
};

export const createConnStringAtlas = ({
  username,
  password,
  hostUrl,
  dbName,
  queries = 'retryWrites=true&w=majority'
}: CreateConnStringAtlasArgs): string => {
  // Prepare a connection string
  let connectionString = `mongodb+srv://`;

  // Append username and password if exists
  if (username && password) connectionString += `${username}:${password}@`;
  connectionString += hostUrl;
  // Append database name if exists
  if (dbName) connectionString += `/${dbName}`;
  // Append queries
  connectionString += `?${queries}`;

  return connectionString;
};
