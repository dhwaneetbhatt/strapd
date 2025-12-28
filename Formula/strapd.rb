class Strapd < Formula
  desc "Developer utility belt for common tasks like encoding, hashing, and data formatting"
  homepage "https://github.com/dhwaneetbhatt/strapd"
  version "1.1.2"
  license "Apache-2.0"

  on_macos do
    on_intel do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.2/strapd-macos-x86_64.tar.gz"
      sha256 "PUT_SHA256_HERE_FOR_INTEL" # This will be updated after release
    end

    on_arm do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.2/strapd-macos-aarch64.tar.gz"
      sha256 "PUT_SHA256_HERE_FOR_ARM" # This will be updated after release
    end
  end

  on_linux do
    on_intel do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.2/strapd-linux-x86_64.tar.gz"
      sha256 "PUT_SHA256_HERE_FOR_LINUX_INTEL" # This will be updated after release
    end

    on_arm do
      url "https://github.com/dhwaneetbhatt/strapd/releases/download/v1.1.2/strapd-linux-aarch64.tar.gz"
      sha256 "PUT_SHA256_HERE_FOR_LINUX_ARM" # This will be updated after release
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
