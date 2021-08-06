{ lib, fetchFromGitHub
, makeWrapper, makeDesktopItem, mkYarnPackage
, electron_9, yarn2nix
}:

let
  executableName = "ao";
  version = "6.9.0";
  electron = electron_9;

in mkYarnPackage rec {
  name = "ao-${version}";
  inherit version;
  
  src = ./.;  # TODO: replace with fetchFromGitHub

  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;

  nativeBuildInputs = [ makeWrapper ];

  installPhase = ''
    # resources
    echo "Installing resources..."
    mkdir -p "$out/share/ao/electron"
    cp -r './deps/ao/static' "$out/share/ao/electron"
    cp -r './deps/ao/src' "$out/share/ao/electron"    
    cp -r './deps/ao/index.js' "$out/share/ao/electron"    
    cp -r './node_modules' "$out/share/ao/electron"    
    
    # icons
    echo "Installing icons..."
    for size in 16x16 24x24 32x32 48x48 64x64 72x72 96x96 128x128 192x192 256x256 512x512 1024x1024; do
      install -Dm644 ./deps/ao/build/icon.png $out/share/icons/hicolor/$size/apps/ao.png
    done
    
    # desktop item
    echo "Installing desktop item..."
    mkdir -p "$out/share"
    ln -s "${desktopItem}/share/applications" "$out/share/applications"
    
    # executable wrapper
    makeWrapper '${electron}/bin/electron' "$out/bin/${executableName}" \
      --argv0 "ao" \
      --add-flags "$out/share/ao/electron"
  '';

  # Do not attempt generating a tarball for contents again.
  # note: `doDist = false;` does not work.
  distPhase = ''
    true
  '';

  desktopItem = with lib; 
    makeDesktopItem {
      name = "ao";
      exec = executableName;
      icon = "ao";
      desktopName = "Ao";
      genericName = "Microsoft To-Do Client";
      comment = concatStringsSep " " 
                  (splitString "\n" meta.description);
      categories = "Office;";
      extraEntries = ''
        StartupWMClass=ao
      '';
    };

  meta = with lib; {
    description = ''
      Ao is an unofficial, featureful, open source, 
      community-driven, free Microsoft To-Do app, 
      used by people in more than 120 countries.
    '';
    homepage = "https://github.com/pythonInRelay/ao";
    license = licenses.mit;
    # maintainers = maintainers.ckopo;
    inherit (electron.meta) platforms;
  };
}

