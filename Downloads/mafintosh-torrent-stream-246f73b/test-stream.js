const torrentStream = require('./');

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('\nUncaught exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\nUnhandled rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Use a well-known public domain torrent (Big Buck Bunny)
const magnetLink = 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';

let engine = null;

function cleanup(exitCode = 0) {
  if (engine) {
    console.log('Cleaning up engine...');
    engine.destroy(() => {
      console.log('Engine destroyed.');
      process.exit(exitCode);
    });
  } else {
    process.exit(exitCode);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  cleanup(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down...');
  cleanup(0);
});

console.log('Starting torrent-stream test...\n');

try {
  engine = torrentStream(magnetLink, {
    connections: 50,
    uploads: 5,
    tmp: '/tmp/torrent-test',
    dht: true,
    tracker: true
  });
} catch (err) {
  console.error('Failed to create torrent engine:', err.message);
  process.exit(1);
}

engine.on('ready', () => {
  console.log('Engine ready!\n');
  console.log(`Found ${engine.files.length} file(s):\n`);

  if (engine.files.length === 0) {
    console.error('No files found in torrent');
    cleanup(1);
    return;
  }

  engine.files.forEach((file, index) => {
    const sizeMB = (file.length / (1024 * 1024)).toFixed(2);
    console.log(`  [${index}] ${file.name}`);
    console.log(`      Path: ${file.path}`);
    console.log(`      Size: ${sizeMB} MB\n`);
  });

  // Select the first file and read a small portion
  const file = engine.files[0];
  console.log(`\nStreaming first 1KB of: ${file.name}\n`);

  let stream;
  try {
    stream = file.createReadStream({ start: 0, end: 1023 });
  } catch (err) {
    console.error('Failed to create read stream:', err.message);
    cleanup(1);
    return;
  }

  let bytesRead = 0;

  stream.on('data', (chunk) => {
    bytesRead += chunk.length;
    console.log(`  Received ${chunk.length} bytes (total: ${bytesRead})`);
  });

  stream.on('end', () => {
    console.log(`\nStream complete! Read ${bytesRead} bytes total.`);
    console.log('Test successful!');
    cleanup(0);
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err.message);
    cleanup(1);
  });
});

engine.on('download', (pieceIndex) => {
  console.log(`  Downloaded piece: ${pieceIndex}`);
});

engine.on('torrent', () => {
  console.log('Metadata fetched from peers');
});

engine.on('error', (err) => {
  console.error('Engine error:', err.message);
  cleanup(1);
});

// Timeout after 60 seconds
const TIMEOUT_MS = 60000;
const timeoutId = setTimeout(() => {
  console.log(`\nTimeout reached (${TIMEOUT_MS / 1000}s) - no response from peers`);
  cleanup(1);
}, TIMEOUT_MS);

// Clear timeout on successful completion
const originalCleanup = cleanup;
cleanup = (exitCode = 0) => {
  clearTimeout(timeoutId);
  originalCleanup(exitCode);
};

console.log('Connecting to DHT and trackers...');
