{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    autoPatchelfHook
  ];

  buildInputs = with pkgs; [
    nodejs_20
    bun
    # Core libraries
    glibc
    stdenv.cc.cc.lib
    # Additional libraries that might be needed
    zlib
    openssl
    # Development tools
    pkg-config
  ];

  shellHook = ''
    # Set up library paths
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc.lib
      pkgs.glibc
      pkgs.zlib
      pkgs.openssl
    ]}:$LD_LIBRARY_PATH"

    # Set up pkg-config paths
    export PKG_CONFIG_PATH="${pkgs.lib.makeSearchPath "lib/pkgconfig" [
      pkgs.zlib
      pkgs.openssl
    ]}:$PKG_CONFIG_PATH"

    # Ensure the workerd binary is executable and patched
    if [ -f "node_modules/@cloudflare/workerd-linux-64/bin/workerd" ]; then
      chmod +x node_modules/@cloudflare/workerd-linux-64/bin/workerd
      autoPatchelf node_modules/@cloudflare/workerd-linux-64/bin/workerd
    fi
  '';
} 