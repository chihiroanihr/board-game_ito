// var username = '$MONGO_DEV_USERNAME';
// var password = '$MONGO_DEV_PASSWORD';
// var replicaSetName = '$REPLICA_SET_NAME';

function initiateReplicaSet() {
  try {
    // Check if replica set is already initialized.
    if (db.hello()?.setName === replicaSetName) {
      console.log('[!] This replica set already exists.');
      return;
    }

    const rsInitiateResult = rs.initiate({
      _id: replicaSetName,
      members: [
        { _id: 0, host: 'mongo1:27017', priority: 1 },
        { _id: 1, host: 'mongo2:27017', priority: 0 },
        { _id: 2, host: 'mongo3:27017', priority: 0 },
      ],
    });

    if (!rsInitiateResult.ok) {
      throw error('[!] Error initiating replica set: ', rsInitiateResult);
    }

    // Wait for the primary to be elected
    while (!db.hello().isWritablePrimary) {
      sleep(1000); // Sleep 1 second at a time
    }

    console.log('[*] Replica set initiated successfully.', rsInitiateResult);
  } catch (error) {
    // Already initiated error
    if (error.code === 23 || error.codeName === 'AlreadyInitialized') {
      console.error('[!] This replica set has been already initiated.', error.code);
    }
    // Other errors
    else {
      console.error(error);
    }
  }
}

try {
  // [1] Initialize replica set
  initiateReplicaSet();

  db.createUser({
    user: rootUsername,
    pwd: rootPassword,
    roles: ['root'],
  });
  console.log('[*] Admin created successfully.');

  // [3] Authenticate the admin
  db.auth(rootUsername, rootPassword);
  console.log('[*] Admin authenticated.');

  // Success: Log everything in the end
  console.log('-----------------------------------------------');
  console.log('[*] RS Status:', rs.status()); // JSON.stringify(rs.status(), null, 2)
  console.log('-----------------------------------------------');
} catch (error) {
  console.error('[!] An error occurred:', error);
}
