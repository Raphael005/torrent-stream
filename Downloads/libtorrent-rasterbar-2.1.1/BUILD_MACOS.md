# Building libtorrent-rasterbar 2.1.1 on macOS

This document describes how to build and test libtorrent on macOS (Apple Silicon).

## Prerequisites

Install dependencies via Homebrew:

```bash
brew install boost openssl@3 cmake
```

## Build Process

### 1. Configure with CMake

```bash
cd libtorrent-rasterbar-2.1.1
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
```

**Configuration options:**

| Option | Default | Description |
|--------|---------|-------------|
| `-Dbuild_tests=ON` | OFF | Build unit tests |
| `-Dbuild_examples=ON` | OFF | Build example applications |
| `-Dpython-bindings=ON` | OFF | Build Python bindings |
| `-Dencryption=ON` | ON | Enable encryption (requires OpenSSL) |
| `-Ddht=ON` | ON | Enable DHT support |
| `-Dwebtorrent=ON` | ON | Enable WebTorrent support |

### 2. Compile

```bash
cmake --build . --parallel $(sysctl -n hw.ncpu)
```

This produces:
- `libtorrent-rasterbar.2.1.dylib` - Shared library
- `libtorrent-rasterbar.dylib` - Symlink to versioned library

### 3. Install (Optional)

```bash
sudo cmake --install .
```

Default install prefix: `/usr/local`

## Linking Against libtorrent

### Compiler Flags

```bash
clang++ -std=c++17 \
    -DTORRENT_USE_OPENSSL=1 \
    -I/path/to/libtorrent/include \
    -I/opt/homebrew/include \
    -L/path/to/libtorrent/build \
    -ltorrent-rasterbar \
    -Wl,-rpath,/path/to/libtorrent/build \
    your_app.cpp -o your_app
```

### Using CMake (Recommended)

```cmake
find_package(LibtorrentRasterbar REQUIRED)
target_link_libraries(your_app PRIVATE LibtorrentRasterbar::torrent-rasterbar)
```

## Session API Quick Start

```cpp
#include <libtorrent/session.hpp>
#include <libtorrent/session_params.hpp>
#include <libtorrent/add_torrent_params.hpp>
#include <libtorrent/magnet_uri.hpp>

namespace lt = libtorrent;

int main() {
    // Configure session
    lt::settings_pack settings;
    settings.set_str(lt::settings_pack::user_agent, "MyApp/1.0");
    settings.set_int(lt::settings_pack::alert_mask,
        lt::alert_category::error | lt::alert_category::status);
    
    // Create session
    lt::session_params params(settings);
    lt::session ses(std::move(params));
    
    // Add torrent from magnet link
    lt::error_code ec;
    lt::add_torrent_params atp = lt::parse_magnet_uri("magnet:?xt=...", ec);
    atp.save_path = "/downloads";
    ses.async_add_torrent(std::move(atp));
    
    // Main loop - process alerts
    while (running) {
        std::vector<lt::alert*> alerts;
        ses.pop_alerts(&alerts);
        for (auto* a : alerts) {
            // Handle alerts...
        }
    }
    
    // Graceful shutdown
    lt::session_proxy proxy = ses.abort();
    return 0;
}
```

## Verified Features (macOS arm64)

| Feature | Status |
|---------|--------|
| Session creation/destruction | ✅ |
| Settings configuration | ✅ |
| Pause/resume | ✅ |
| Magnet URI parsing | ✅ |
| Alert system | ✅ |
| Listen interfaces (TCP/uTP) | ✅ |
| DHT | ✅ |
| Session state save/load | ✅ |
| Graceful shutdown (session_proxy) | ✅ |

## Build Environment Used

- **OS**: macOS (Apple Silicon / arm64)
- **Compiler**: AppleClang
- **Boost**: 1.90.0
- **OpenSSL**: 3.6.3
- **CMake**: 3.x

## Troubleshooting

### Missing OpenSSL

```
CMake Error: Could not find OpenSSL
```

Solution:
```bash
export OPENSSL_ROOT_DIR=/opt/homebrew/opt/openssl@3
cmake .. -DOPENSSL_ROOT_DIR=/opt/homebrew/opt/openssl@3
```

### TORRENT_USE_RTC Error

```
error: compiling with TORRENT_USE_RTC requires TORRENT_USE_OPENSSL
```

Solution: Add `-DTORRENT_USE_OPENSSL=1` to your compile flags.

### Runtime Library Not Found

```
dyld: Library not loaded: @rpath/libtorrent-rasterbar.2.1.dylib
```

Solution: Add `-Wl,-rpath,/path/to/lib` when linking, or set:
```bash
export DYLD_LIBRARY_PATH=/path/to/libtorrent/build:$DYLD_LIBRARY_PATH
```

## References

- [Official Documentation](https://libtorrent.org/)
- [Building Guide](https://libtorrent.org/building.html)
- [Python Bindings](https://libtorrent.org/python_binding.html)
- [GitHub Repository](https://github.com/arvidn/libtorrent)
