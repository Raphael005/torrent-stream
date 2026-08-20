```

#### `file.select()`

Selects the file to be downloaded, but at a lower priority than streams.
Useful if you know you need the file at a later stage.

#### `file.deselect()`

Deselects the file which means it won't be downloaded unless someone creates a stream to it

#### `stream = file.createReadStream(opts)`

Create a readable stream to the file. Pieces needed by the stream will be prioritized highly.
Options can contain the following

``` js
{
        start: startByte,
        end: endByte
}
```

Both `start` and `end` are inclusive

## License

MIT
