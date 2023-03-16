{
  description = "Kuro's Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem 
      (system:
        let pkgs = nixpkgs.legacyPackages.${system}; in
        {
          packages.default = import ./default.nix { inherit pkgs; };
          # TODO: add shell support (with electron and node_modules symlink)
        }
      );
}