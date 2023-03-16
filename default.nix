{ pkgs ? import <nixpkgs> {} }:

# TODO: add shell support (with electron and node_modules symlink)
pkgs.callPackage ./release.nix {
  electron = pkgs.electron_22;
}

