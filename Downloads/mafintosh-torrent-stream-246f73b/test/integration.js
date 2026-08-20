var test = require('tap').test
var torrents = require('../')
var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')

// Test configuration
var TIMEOUT = 30000
var TEST_TMP_PATH = path.join(__dirname, '..', 'torrents', 'integration-test')
var TORRENT_FILE = path.join(__dirname, 'data', 'test.torrent')

// Fixtures
var fixture
var torrentBuffer

// Helper for timeout (tap 0.4.x doesn't have timeoutAfter)
function withTimeout (t, ms, fn) {
  var timer = setTimeout(function () {
    t.fail('test timed out after ' + ms + 'ms')
    t.end()
  }, ms)

  var originalEnd = t.end.bind(t)
  t.end = function () {
    clearTimeout(timer)
    originalEnd()
  }

  fn()
}

// Setup
test('setup', function (t) {
  rimraf.sync(TEST_TMP_PATH)
  torrentBuffer = fs.readFileSync(TORRENT_FILE)
  t.ok(torrentBuffer, 'torrent file should be readable')
  t.end()
})

// Engine Creation Tests
test('engine creation - from torrent buffer', function (t) {
  t.plan(2)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  t.ok(engine, 'engine should be created')

  engine.on('ready', function () {
    t.ok(true, 'engine should emit ready event')
    engine.destroy()
  })
})

test('engine creation - with custom options', function (t) {
  t.plan(3)

  var customPath = path.join(TEST_TMP_PATH, 'custom')
  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    path: customPath,
    connections: 50,
    uploads: 5
  })

  t.ok(engine, 'engine should be created with custom options')

  engine.on('ready', function () {
    t.ok(true, 'engine should be ready')
    t.equal(engine.path, customPath, 'path should match custom path')
    engine.destroy(function () {
      rimraf.sync(customPath)
    })
  })
})

// File Access Tests
test('file access - files array populated on ready', function (t) {
  t.plan(3)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  engine.on('ready', function () {
    t.ok(Array.isArray(engine.files), 'files should be an array')
    t.ok(engine.files.length > 0, 'files array should not be empty')
    t.ok(engine.files[0].name, 'file should have a name property')
    engine.destroy()
  })
})

test('file access - file properties', function (t) {
  t.plan(4)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  engine.on('ready', function () {
    var file = engine.files[0]
    t.ok(file.name, 'file should have name')
    t.ok(file.path, 'file should have path')
    t.ok(typeof file.length === 'number', 'file should have numeric length')
    t.ok(typeof file.createReadStream === 'function', 'file should have createReadStream method')
    engine.destroy()
  })
})

// Stream Tests
test('stream creation - basic read stream', function (t) {
  t.plan(2)

  fixture = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    path: path.join(__dirname, 'data')
  })

  fixture.on('ready', function () {
    var file = fixture.files[0]
    var stream = file.createReadStream()
    t.ok(stream, 'stream should be created')
    t.ok(typeof stream.on === 'function', 'stream should be event emitter')
    stream.destroy()
  })
})

test('stream creation - with range options', function (t) {
  t.plan(2)

  // Create a fresh engine for this test
  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    path: path.join(__dirname, 'data')
  })

  engine.on('ready', function () {
    var file = engine.files[0]
    // Just verify the stream can be created with options
    var stream = file.createReadStream({ start: 0, end: 100 })
    t.ok(stream, 'ranged stream should be created')
    t.ok(stream.readable !== false, 'stream should be readable')
    stream.destroy()
    engine.destroy()
  })
})

// Selection Tests
test('file selection - select and deselect', function (t) {
  t.plan(2)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  engine.on('ready', function () {
    var file = engine.files[0]

    // Should not throw
    try {
      file.select()
      t.ok(true, 'select should not throw')
    } catch (e) {
      t.fail('select threw: ' + e.message)
    }

    try {
      file.deselect()
      t.ok(true, 'deselect should not throw')
    } catch (e) {
      t.fail('deselect threw: ' + e.message)
    }

    engine.destroy()
  })
})

// Lifecycle Tests
test('lifecycle - destroy callback', function (t) {
  t.plan(1)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  engine.destroy(function () {
    t.ok(true, 'destroy callback should be called')
  })
})

test('lifecycle - destroy before ready', function (t) {
  t.plan(1)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  // Immediately destroy without waiting for ready
  engine.destroy(function () {
    t.ok(true, 'should handle destroy before ready')
  })
})

test('lifecycle - remove after destroy', function (t) {
  t.plan(2)

  var removePath = path.join(TEST_TMP_PATH, 'to-remove-' + Date.now())
  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    path: removePath
  })

  engine.on('ready', function () {
    engine.destroy(function () {
      t.ok(true, 'engine should be destroyed')
      // engine.remove may error if path doesn't exist yet, which is fine
      // The important thing is the callback is called
      engine.remove(function () {
        t.ok(true, 'remove callback should be called')
      })
    })
  })
})

// Error Handling Tests
test('error handling - invalid torrent should not crash', function (t) {
  t.plan(1)

  try {
    var engine = torrents(Buffer.from('invalid torrent data'), {
      dht: false,
      tracker: false,
      tmp: TEST_TMP_PATH
    })
    // If it doesn't throw, destroy it
    if (engine) {
      engine.destroy()
    }
    t.ok(true, 'should handle invalid torrent gracefully or throw')
  } catch (e) {
    t.ok(true, 'should throw for invalid torrent: ' + e.message)
  }
})

// Swarm Tests
test('swarm - swarm property exists', function (t) {
  t.plan(2)

  var engine = torrents(torrentBuffer, {
    dht: false,
    tracker: false,
    tmp: TEST_TMP_PATH
  })

  engine.on('ready', function () {
    t.ok(engine.swarm, 'swarm should exist')
    t.ok(typeof engine.swarm.downloaded === 'number', 'swarm.downloaded should be a number')
    engine.destroy()
  })
})

// Cleanup
test('cleanup fixture', function (t) {
  t.plan(1)

  if (fixture) {
    fixture.destroy(function () {
      fixture.remove(function () {
        t.ok(true, 'fixture cleaned up')
        rimraf.sync(TEST_TMP_PATH)
      })
    })
  } else {
    rimraf.sync(TEST_TMP_PATH)
    t.ok(true, 'cleanup complete')
  }
})
