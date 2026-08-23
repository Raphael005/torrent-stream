# Building libtorrent on macOS

## Supported macOS Versions

| OS    | Versions   | Architectures | Notes                                      |
|-------|------------|---------------|--------------------------------------------|
| macOS | 26, 15, 14 | Arm64, x64    | Rosetta 2 (x64 emulation) supported on Arm64 |

## Prerequisites

Install dependencies via Homebrew:

```bash
brew install boost-build boost openssl@3
```

Configure Boost.Build toolset:

```bash
echo 'using darwin ;' >> ~/user-config.jam
```

## Cloning Dependencies

If building from a source archive (not a git clone), you need to manually clone the submodule dependencies:

```bash
cd deps
git clone https://github.com/arvidn/try_signal.git
git clone https://github.com/paullouisageneau/libdatachannel.git
git clone https://github.com/paullouisageneau/boost-asio-gnutls.git asio-gnutls

# If using libdatachannel (webtorrent support), also init its submodules:
cd libdatachannel
git submodule update --init --recursive
cd ../..
```

## Build Commands

### Basic build (without WebTorrent support)

```bash
b2 crypto=openssl webtorrent=off release include=./include
```

### Full build (with WebTorrent support)

```bash
b2 crypto=openssl release include=./include
```

### Build options

- `crypto=openssl` — Use OpenSSL for cryptography
- `webtorrent=off` — Disable WebTorrent/libdatachannel support
- `release` — Build in release mode (optimized)
- `include=./include` — Use project headers instead of system-installed libtorrent headers

## Output

The built library will be located at:

```
bin/darwin-*/release/cxxstd-17-iso/threading-multi/visibility-hidden/webtorrent-off/libtorrent-rasterbar.dylib.2.1.0
```

## Running Tests

```bash
b2 crypto=openssl webtorrent=off release include=./include test
```

Note: Some tests require fixture files that may not be present in source archives.

## Cleaning Build Artifacts

```bash
rm -rf bin deps/libdatachannel/bin
```
