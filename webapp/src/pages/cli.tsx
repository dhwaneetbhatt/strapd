import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Code,
  Container,
  Divider,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiDownload,
  FiGithub,
  FiGlobe,
  FiRefreshCw,
  FiThumbsUp,
  FiZap,
} from "react-icons/fi";
import { Layout } from "../components/layout";

interface FeatureCardProps {
  icon: React.ComponentType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <Box
      bg="surface.raised"
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor="border.base"
      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
      transition="all 0.2s"
    >
      <VStack align="start" spacing={3}>
        <HStack>
          <Icon as={icon} boxSize={6} color="text.brand" />
          <Heading size="md" color="text.brand">
            {title}
          </Heading>
        </HStack>
        <Text color="text.secondary">{description}</Text>
      </VStack>
    </Box>
  );
};

export const CLI: React.FC = () => {
  return (
    <Layout>
      <Box minH="calc(100vh - 80px)" bg="surface.base">
        <Container maxW="4xl" py={12}>
          <VStack spacing={12} align="stretch">
            {/* Hero Section */}
            <Box textAlign="center">
              <Heading
                size="2xl"
                bgGradient="linear(to-r, brand.500, brand.600)"
                bgClip="text"
                mb={4}
              >
                strapd cli 🛠️
              </Heading>
              <Text
                fontSize="xl"
                color="text.secondary"
                maxW="2xl"
                mx="auto"
                mb={6}
              >
                Fast, portable command-line tool written in Rust. Perfect for
                developers who need quick string manipulation, data conversions,
                and utility operations from the terminal.
              </Text>

              <HStack justify="center" spacing={4}>
                <Button
                  as="a"
                  href="#installation"
                  leftIcon={<FiDownload />}
                  colorScheme="brand"
                  size="lg"
                >
                  Install CLI
                </Button>
                <Button
                  as="a"
                  href="https://github.com/dhwaneetbhatt/strapd"
                  target="_blank"
                  leftIcon={<FiGithub />}
                  rightIcon={<ExternalLinkIcon />}
                  variant="outline"
                  size="lg"
                >
                  View Source
                </Button>
              </HStack>

              <Box mt={6}>
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  Single Binary • No Dependencies • Cross-Platform
                </Badge>
              </Box>
            </Box>

            {/* Features Grid */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FeatureCard
                icon={FiZap}
                title="Fast"
                description="Written in Rust, runs quickly with minimal resource usage"
              />
              <FeatureCard
                icon={FiGlobe}
                title="Portable"
                description="Linux, macOS, Windows, single binary, no dependencies"
              />
              <FeatureCard
                icon={FiThumbsUp}
                title="Easy "
                description="Designed specifically for ease of use in terminal workflows"
              />
              <FeatureCard
                icon={FiRefreshCw}
                title="Flexible"
                description="Multiple aliases so commands feel natural and intuitive"
              />
            </SimpleGrid>

            <Divider />

            {/* Installation Section */}
            <Box id="installation">
              <Heading size="lg" mb={6} color="text.primary">
                Installation 📥
              </Heading>

              <VStack spacing={6} align="stretch">
                {/* Quick Install Section */}
                <Box
                  bg="surface.raised"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border.base"
                >
                  <Heading size="md" mb={4} color="text.brand">
                    ⚡ Quick Install
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" mb={2} color="text.primary">
                        Linux & macOS
                      </Text>
                      <Box
                        bg="surface.muted"
                        p={4}
                        borderRadius="md"
                        overflow="auto"
                      >
                        <Code
                          display="block"
                          whiteSpace="pre"
                          color="green.600"
                          bg="transparent"
                          fontSize="sm"
                        >
                          {`curl -fsSL https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.sh | bash`}
                        </Code>
                      </Box>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={2} color="text.primary">
                        Windows
                      </Text>
                      <Box
                        bg="surface.muted"
                        p={4}
                        borderRadius="md"
                        overflow="auto"
                      >
                        <Code
                          display="block"
                          whiteSpace="pre"
                          color="blue.600"
                          bg="transparent"
                          fontSize="sm"
                        >
                          {`Invoke-RestMethod -Uri "https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.ps1" | Invoke-Expression`}
                        </Code>
                      </Box>
                    </Box>
                  </VStack>
                </Box>

                {/* Manual Download Section */}
                <Box
                  bg="surface.raised"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border.base"
                >
                  <Heading size="md" mb={4} color="text.brand">
                    📦 Manual Download
                  </Heading>
                  <Text color="text.secondary" mb={4}>
                    Download pre-built binaries from{" "}
                    <Button
                      as="a"
                      href="https://github.com/dhwaneetbhatt/strapd/releases"
                      target="_blank"
                      variant="link"
                      color="brand.500"
                      rightIcon={<ExternalLinkIcon />}
                      p={0}
                      h="auto"
                      minH="auto"
                    >
                      Releases
                    </Button>
                  </Text>
                </Box>

                {/* From Source Section */}
                <Box
                  bg="surface.raised"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border.base"
                >
                  <Heading size="md" mb={4} color="text.brand">
                    🔧 From Source
                  </Heading>
                  <Box
                    bg="surface.muted"
                    p={4}
                    borderRadius="md"
                    overflow="auto"
                  >
                    <Code
                      display="block"
                      whiteSpace="pre"
                      color="green.600"
                      bg="transparent"
                      fontSize="sm"
                    >
                      {`git clone https://github.com/dhwaneetbhatt/strapd.git
cd strapd
make cli-release
sudo ln -s $(pwd)/target/release/strapd /usr/local/bin/strapd`}
                    </Code>
                  </Box>
                </Box>

                <Box
                  bg="surface.raised"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="border.base"
                >
                  <Heading size="md" mb={4} color="text.brand">
                    🚀 Quick Examples
                  </Heading>
                  <Box
                    bg="surface.muted"
                    p={4}
                    borderRadius="md"
                    overflow="auto"
                  >
                    <Code
                      display="block"
                      whiteSpace="pre"
                      color="cyan.600"
                      bg="transparent"
                      fontSize="sm"
                    >
                      {`# Convert text to uppercase
strapd str upper "hello world"

# Pipe from stdin
echo "Hello, World!" | strapd str upper

# Use clipboard
strapd copy | strapd str upper | strapd paste`}
                    </Code>
                  </Box>
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Features List */}
            <Box>
              <Heading size="lg" mb={6} color="text.primary">
                Features ✨
              </Heading>

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                {[
                  {
                    icon: "🔤",
                    title: "String Tools",
                    desc: "case, trim, slugify, reverse, replace, analysis",
                  },
                  { icon: "🆔", title: "UUIDs", desc: "v4, v7" },
                  { icon: "🔐", title: "Encoding", desc: "Base64, URL, Hex" },
                  {
                    icon: "📊",
                    title: "Data Formatting",
                    desc: "JSON, XML, SQL",
                  },
                  {
                    icon: "🔄",
                    title: "YAML ⇄ JSON",
                    desc: "Bidirectional conversion",
                  },
                  { icon: "🔒", title: "Security", desc: "Hash, HMAC" },
                  { icon: "🎲", title: "Random", desc: "numbers, strings" },
                  { icon: "🕒", title: "Date/Time", desc: "timestamps" },
                  { icon: "📋", title: "Clipboard", desc: "copy and paste" },
                ].map((feature) => (
                  <Box
                    key={feature.title}
                    bg="surface.raised"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border.base"
                  >
                    <HStack>
                      <Text fontSize="xl">{feature.icon}</Text>
                      <Box>
                        <Text fontWeight="semibold" color="text.brand">
                          {feature.title}
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                          {feature.desc}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Footer */}
            <Box textAlign="center" py={8}>
              <Text color="text.secondary">
                Licensed under the Apache License 2.0 |{" "}
                <Button
                  as="a"
                  href="https://github.com/dhwaneetbhatt/strapd"
                  target="_blank"
                  variant="link"
                  color="brand.500"
                  rightIcon={<ExternalLinkIcon />}
                >
                  View Source on GitHub
                </Button>
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
};
