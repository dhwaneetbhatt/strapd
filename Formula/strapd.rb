class Strapd < Formula
  desc "Developer utility belt for common tasks like encoding, hashing, and data formatting"
  homepage "https://github.com/dhwaneetbhatt/strapd"
  version "1.1.0"
  license "Apache-2.0"

  on_macos do
    on_intel do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.0/strapd-macos-x86_64.tar.gz"
      sha256 "bedea44388fb9bcb4f175e5ff634eaca71e2a29293e8c48fb6eff1107f4ff6d7"
    end

    on_arm do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.0/strapd-macos-aarch64.tar.gz"
      sha256 "275e4e51615838cc1a3139544a90cfa8b40918eb67263ce52f5bfcb4fb88529e"
    end
  end

  on_linux do
    on_intel do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.0/strapd-linux-x86_64.tar.gz"
      sha256 "1b9ba0fa0ff41285161358c07ccd112586f04facb4030a6e8cf5d2032271d27c"
    end

    on_arm do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.0/strapd-linux-aarch64.tar.gz"
      sha256 "0233174d72ee8164aa6ba39aa5846e915d02610300d00565297b16e05d63e475"
    end
  end

  def install
    bin.install "strapd"
  end

  test do
    # Test basic functionality
    assert_match "HELLO WORLD", shell_output("#{bin}/strapd str upper 'hello world'")

    # Test version output
    system "#{bin}/strapd", "--version"

    # Test help output
    system "#{bin}/strapd", "--help"

    # Test UUID generation
    output = shell_output("#{bin}/strapd uuid v4")
    assert_match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, output.strip)

    # Test encoding
    assert_match "aGVsbG8=", shell_output("#{bin}/strapd encoding base64 encode hello")
  end
end
