// var username = '$MONGO_DEV_USERNAME' | '$MONGO_PROD_USERNAME' | '$MONGO_TEST_USERNAME';
// var password = '$MONGO_DEV_PASSWORD' | '$MONGO_PROD_PASSWORD' | '$MONGO_TEST_PASSWORD';
// var dbName = '$MONGO_DEV_DB_NAME' | '$MONGO_PROD_DB_NAME' | '$MONGO_TEST_DB_NAME';

function createDbUser(username, password, roles) {
  try {
    db.createUser({
      user: username,
      pwd: password,
      roles: roles,
    });
    console.log(`Creation of user "${username}" successful.`);
  } catch (error) {
    // Already created error
    if (error.code === 51003 || error.codeName === 'Location51003') {
      console.error(`[!] This user "${username}" already exists. `, error.code);
    }
    // Other errors
    else {
      console.error(`[!] Error creating user "${username}": `, error);
    }
  }
}

try {
  // [1] Authenticate the admin
  db.auth(rootUsername, rootPassword);
  console.log('[*] Admin authenticated.');

  // Wait for the primary to be elected
  while (!db.hello().isWritablePrimary) {
    sleep(1000); // Sleep 1 second at a time
  }

  // [2] Create new DB
  db = db.getSiblingDB(dbName);
  // [3] Create a new user (for client connection) with readWrite access to its database.
  createDbUser(username, password, ['readWrite']);

  // Success: Log everything in the end
  console.log('-----------------------------------------------');
  console.log('[*] User Status:', db.getUsers()); // JSON.stringify(db.getUsers(), null, 2)
  console.log('-----------------------------------------------');
  //   console.log('[*] Collection Infos:', db.getCollectionInfos()); // JSON.stringify(db.getCollectionInfos(), null, 2)
  //   console.log('-----------------------------------------------');
} catch (error) {
  console.error('[!] An error occurred:', error);
}
