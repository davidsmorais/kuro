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



### Nix Instructions (by @LostAttractor)
Improve suggestion is from https://github.com/NixOS/nixpkgs/pull/211022

And, The Nix mainline has been migrated to the brand-new flake system. So, we now have Flake support!
Most intuitively, we can now just use `nix run` in the project directory to build and run kuro package directly.
There also is `nix develop` for develop shell (Not yet implemented, so now just nothing), and `nix build` command for build package.
If this pull request is merged, We also can use`nix run github:davidsmorais/kuro` to do same things but anywhere with nix.
And I didn't remove `default.nix` so the legacy `nix-build` command is also work.

You can find more here: https://nixos.org/manual/nix/stable/command-ref/experimental-commands.html

Here is also some help for packaging for nix:

For this current package, Nix will independently manage and use the Electron binary provided by itself, so if you update the Electron version, you need to update the Electron provided to the Nix package synchronously(in `default.nix`).

If there is no change in the software architecture related to Electron (also no calls to other things like natively compiled binaries), you need to do these things when syncing versions:

Update the `rev` and the `hash` in the `fetchFromGitHub` method:

The `rev` can be a released version ([like 9.0.0](https://github.com/davidsmorais/kuro/releases/tag/v9.0.0)) or a commit hash ([like `daec9191a69a4e5fae709867f63a479036624a98`](https://github.com/davidsmorais/kuro/commit/daec9191a69a4e5fae709867f63a479036624a98))
The `hash` can be calculated by fetch the tarball of source like this:
```sh
nix flake prefetch https://github.com/davidsmorais/kuro/archive/refs/tags/v9.0.0.tar.gz
```
This will [download the tarball and unpack it](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake-prefetch.html), store it and able to used by flake, and also calculate the **[SRI hash with sha256](https://github.com/NixOS/nixpkgs/issues/191128#issuecomment-1246030466)**.

And we need `yarn.nix` for `mkYarnPackage` to download all yarn packages at build time. You [can use `yarn2nix` for `yarn.nix`](https://nixos.wiki/wiki/Node.js#Packaging_with_yarn2nix):
```sh
yarn2nix > yarn.nix
```
Make sure you have done `yarn install` before do this.

Generally, that's all you have to do,
