{ lib
, fetchFromGitHub
, makeWrapper
, makeDesktopItem
, copyDesktopItems
, mkYarnPackage
, electron
, imagemagick
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

  ELECTRON_SKIP_BINARY_DOWNLOAD = "1";

  nativeBuildInputs = [
    makeWrapper
    copyDesktopItems
    imagemagick
  ];

  postBuild = ''
    pushd deps/kuro

    yarn --offline run electron-builder \
      --dir \
      -c.electronDist=${electron}/lib/electron \
      -c.electronVersion=${electron.version}

    popd
  '';

  installPhase = ''
    runHook preInstall

    # resources
    mkdir -p "$out/share/lib/kuro"
    cp -r ./deps/kuro/dist/*-unpacked/{locales,resources{,.pak}} "$out/share/lib/kuro"

    # icons - the source icon is 1080x1080, which is not a hicolor size, so
    # render one correctly sized PNG per hicolor directory (referenced by the
    # desktop item's Icon=kuro).
    for size in 16 24 32 48 64 72 96 128 192 256 512; do
      magick ./deps/kuro/static/Icon.png -resize "''${size}x''${size}" kuro-$size.png
      install -Dm644 kuro-$size.png "$out/share/icons/hicolor/''${size}x''${size}/apps/kuro.png"
    done

    # executable wrapper
    makeWrapper '${electron}/bin/electron' "$out/bin/${executableName}" \
      --add-flags "$out/share/lib/kuro/resources/app.asar" \
      --add-flags "\''${NIXOS_OZONE_WL:+\''${WAYLAND_DISPLAY:+--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations}}" \
      --inherit-argv0

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
    mainProgram = executableName;
    maintainers = with maintainers; [ ChaosAttractor ];
    inherit (electron.meta) platforms;
  };
}
