# Build instructions
Since there are native Windows & macOs clients, currently Kuro is only build distributed for Linux distros.

## Pre-requisites
These are the pre-requisites to build packages. On a default Ubuntu install I had to install the following targets:

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




## Building the packages
Simply run `yarn release`
