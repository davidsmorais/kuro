{ lib
, fetchFromGitHub
, makeWrapper
, makeDesktopItem
, copyDesktopItems
, mkYarnPackage
, electron
}:

mkYarnPackage rec {
  pname = "kuro";
  version = "9.0.0";
  executableName = pname;

  src = fetchFromGitHub {
    owner = "davidsmorais";
    repo = pname;
    rev = "v${version}";
    sha256 = "sha256-9Z/r5T5ZI5aBghHmwiJcft/x/wTRzDlbIupujN2RFfU=";
  };

  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./yarn.nix;

  nativeBuildInputs = [
    makeWrapper
    copyDesktopItems
  ];

  installPhase = ''
    runHook preInstall

    # resources
    echo "Installing resources..."
    mkdir -p "$out/share/kuro/electron"
    cp -r './deps/kuro/static' "$out/share/kuro/electron"
    cp -r './deps/kuro/src' "$out/share/kuro/electron"
    cp -r './deps/kuro/index.js' "$out/share/kuro/electron"
    cp -r './node_modules' "$out/share/kuro/electron"

    # icons
    echo "Installing icons..."
    for size in 16x16 24x24 32x32 48x48 64x64 72x72 96x96 128x128 192x192 256x256 512x512 1024x1024; do
      install -Dm644 ./deps/kuro/static/Icon.png $out/share/icons/hicolor/$size/apps/kuro.png
    done

    # executable wrapper
    makeWrapper '${electron}/bin/electron' "$out/bin/${executableName}" \
      --argv0 "kuro" \
      --add-flags "$out/share/kuro/electron"

    runHook postInstall
  '';
  # Do not attempt generating a tarball for contents again.
  # note: `doDist = false;` does not work.
  distPhase = "true";

  desktopItems = [
    (makeDesktopItem {
      name = pname;
      exec = pname;
      icon = pname;
      desktopName = "Kuro";
      genericName = "Microsoft To-Do Client";
      comment = meta.description;
      categories = [ "Office" ];
      startupWMClass = pname;
    })
  ];

  meta = with lib; {
    description = "An unofficial, featureful, open source, community-driven, free Microsoft To-Do app";
    homepage = "https://github.com/davidsmorais/kuro";
    license = licenses.mit;
    maintainers = with maintainers; [ ChaosAttractor ];
    inherit (electron.meta) platforms;
  };
}
