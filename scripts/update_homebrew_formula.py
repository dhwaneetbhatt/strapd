#!/usr/bin/env python3
import re
import os
import sys

def main():
    # Get environment variables
    tag = os.environ.get('TAG_NAME')
    if not tag:
        print("Error: TAG_NAME environment variable not set")
        sys.exit(1)

    shas = {
        ('macos', 'aarch64'): os.environ.get('MACOS_SHA_AARCH64'),
        ('macos', 'x86_64'): os.environ.get('MACOS_SHA_X86_64'),
        ('linux', 'aarch64'): os.environ.get('LINUX_SHA_AARCH64'),
        ('linux', 'x86_64'): os.environ.get('LINUX_SHA_X86_64'),
    }

    # Verify all SHAs are present
    for (os_name, arch), sha in shas.items():
        if not sha:
            print(f"Error: SHA for {os_name}-{arch} not set")
            sys.exit(1)

    file_path = 'homebrew-tap/Formula/strapd.rb'
    
    if not os.path.exists(file_path):
        print(f'Error: {file_path} not found')
        sys.exit(1)
        
    with open(file_path, 'r') as f:
        content = f.read()

    # Update version
    # matching version "v1.2.3" or version "1.2.3"
    content = re.sub(r'version \"v?[0-9]+\.[0-9]+\.[0-9]+\"', f'version \"{tag}\"', content)

    # Function to update url and sha for a specific os and architecture
    def update_artifact(text, os_name, arch_marker, new_sha):
        base_url = f'https://github.com/dhwaneetbhatt/strapd/releases/download/{tag}'
        filename = f'strapd-{os_name}-{arch_marker}.tar.gz'
        new_url = f'{base_url}/{filename}'
        
        # 1. Update URL
        # Looking for matching URL regardless of version in it, ending with key suffix
        escaped_filename_suffix = r'strapd-' + os_name + r'-' + arch_marker + r'\.tar\.gz'
        pattern_url = r'url \".*?/' + escaped_filename_suffix + r'\"'
        
        text = re.sub(pattern_url, f'url \"{new_url}\"', text)

        # 2. Update SHA associated with that URL
        escaped_new_url = re.escape(new_url)
        pattern_sha = r'(url \"' + escaped_new_url + r'\".*?sha256 \")([a-f0-9]+)(\")'
        text = re.sub(pattern_sha, r'\g<1>' + new_sha + r'\g<3>', text, flags=re.DOTALL)
        
        return text

    for (os_name, arch), sha in shas.items():
        content = update_artifact(content, os_name, arch, sha)

    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"Successfully updated {file_path} for version {tag}")

if __name__ == "__main__":
    main()
