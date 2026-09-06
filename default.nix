{ pkgs ? import <nixpkgs> {} }:

# TODO: add shell support (with electron and node_modules symlink)
# `electron_22` no longer exists in nixpkgs; use the current electron, which
# matches the major version in package.json far better than a pinned EOL one.
pkgs.callPackage ./release.nix {
  electron = pkgs.electron;
}

