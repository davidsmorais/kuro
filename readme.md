<p align="center">
<img src="https://raw.githubusercontent.com/davidsmorais/kuro/master/static/Icon.png" width="300" />
</p>

## Description

Kuro is an unofficial, featureful, open source, community-driven, free Microsoft To-Do app for Linux, made by [David Morais](https://davidmorais.com)


## Main Features
- The best Microsoft ToDo desktop client for Linux
- [Custom Themes 🎨](https://github.com/davidsmorais/kuro/wiki/Custom-Themes-%F0%9F%8E%A8)
- [Global Keyboard Shortcuts ⌨️](https://github.com/davidsmorais/kuro/wiki/Keyboard-Shortcuts)

![image](https://user-images.githubusercontent.com/22729436/221692628-73b21cee-567f-4e48-a91c-3cd8db7b9438.png)

> ⚠️ Kuro is a fork of [Ao](https://github.com/klaussinani/ao) which is no longer actively maintained

## Installation
![Latest version](https://badge.fury.io/gh/davidsmorais%2Fkuro.svg)

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/kuro-desktop)

Head over to the [releases 🚀](https://github.com/davidsmorais/kuro/releases) page and download your distribution's package.
Checkout our [Installation Guide](https://github.com/davidsmorais/kuro/wiki/Installing-Kuro) for more information

### Snapcraft

Kuro can be found on the [Snap Store](https://snapcraft.io/kuro-desktop/).
If you have Snap installed on your system you can install Kuro from the **stable** channel by running
```
sudo snap install kuro-desktop
```
Then launch it from your desktop's application menu, or run `kuro-desktop` (snap puts the binary in `/snap/bin`, which is normally on your `PATH`; if it is not, run `/snap/bin/kuro-desktop`).

> ⚠️ Do **not** use `--edge`: the edge channel is outdated and no longer maintained. If you previously installed it, switch with `sudo snap refresh kuro-desktop --stable`.

Kuro stores its settings in `~/.config/Kuro/` (`~/snap/kuro-desktop/current/.config/Kuro/` for the snap), following the XDG base directory spec. A `~/.kuro.json` from older versions is moved there automatically on first start.
### AUR

Kuro can be found in [AUR](https://aur.archlinux.org/packages/kuro-appimage) (Thanks to [Reverier-Xu](https://github.com/Reverier-Xu)).
To install Kuro, you can run

```
paru -S kuro-appimage
```

or

```
yay -S kuro-appimage
```

* **Do not request new package types**. You can submit the PR or an [issue](https://github.com/davidsmorais/kuro/issues/new/choose) to have them built.



### Wayland

Kuro runs through XWayland by default. To run natively on Wayland (crisp HiDPI scaling), start it with Electron's standard environment variable, for example:

```
ELECTRON_OZONE_PLATFORM_HINT=auto kuro-desktop
```

Note that the optional global shortcuts only work on X11.

## Bug 🐞, Questions ❓ or  Feature Request 🚀 ?
Submit an [issue](https://github.com/davidsmorais/kuro/issues/new/choose) or a PR.



## [Devlog](./docs/devlog.md)

### 01/08/2025
Two years have passed since the last update, and Kuro has been stable. I have been working on other projects, but I am still committed to maintaining Kuro. 9.1 should be released soon, with some fixes, security updates and a tiny new feature ✨

---
Please provide feedback on the [issues](https://github.com/davidsmorais/kuro/issues) page 🚀


---

## Documentation
Check out our [Wiki](https://github.com/davidsmorais/kuro/wiki) for documentation

## To-Do List
- [X] Full rebranding of Ao into Kuro
- [x] Cleaning all the bugs. These can be found in the [issues](https://github.com/davidsmorais/kuro/issues) page 🚀
- [ ] Implementing CI/CD for Linux packages 🚀
- [X] Revision of documentation
  - [ ] Landing Page with Documentation
- [ ] Multi account support
