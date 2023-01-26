# Build instructions
Since there are native Windows & macOs clients, currently Kuro is only build distributed for Linux distros.

## Pre-requisites
These are the pre-requisites to build packages. On a default Ubuntu install I had to install the following targets:

## 32-bit systems
[Electron is no longer supporting 32bit Linux architecture](https://www.electronjs.org/blog/linux-32bit-support) so when we updated electron to 22.1.0 version in 8.1.7, we also lost the 32bit support.
The last [Kuro version which works in 32bit systems is 8.1.6](https://github.com/davidsmorais/kuro/releases/tag/v8.1.6)
### `.rpm`
You need the following packages to build the `.rpm` packagetarget
```
 sudo apt-get update
 sudo apt-get install --no-install-recommends -y gcc-multilib g++-multilib
 sudo apt-get install --no-install-recommends -y rpm
 sudo apt-get install snapd && sudo snap install snapcraft --clasic
```

### `.pacman`
You need the following packages to build `.pacman` target.
```
sudo apt install libarchive-tools
```

### `snap`
Change the package.json name of the app to `kuro-desktop`
Run `pnpm build-snap`
After logging in to the snapcraft store
```
 snapcraft upload --release=stable dist/kuro-desktop_<release_name>
```


### Windows
You can build the package for Windows. Simply clone the repo install the dependencies and run `pnpm build-win`



## Building the packages
Simply run `yarn release`
