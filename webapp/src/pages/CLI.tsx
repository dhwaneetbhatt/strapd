import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Code,
  useColorModeValue,
  Divider,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { FiGithub, FiDownload, FiZap, FiGlobe, FiTarget, FiRefreshCw } from 'react-icons/fi';
import { Layout } from '../components/layout/Layout';

interface FeatureCardProps {
  icon: React.ComponentType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bg}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack align="start" spacing={3}>
        <HStack>
          <Icon as={icon} boxSize={6} color="brand.500" />
          <Heading size="md" color="brand.600" _dark={{ color: 'brand.300' }}>
            {title}
          </Heading>
        </HStack>
        <Text color="gray.600" _dark={{ color: 'gray.400' }}>
          {description}
        </Text>
      </VStack>
    </Box>
  );
};

export const CLI: React.FC = () => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Layout>
      <Box minH="calc(100vh - 80px)" bg={bg}>
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
                strapd CLI 🛠️
              </Heading>
              <Text
                fontSize="xl"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                maxW="2xl"
                mx="auto"
                mb={6}
              >
                Fast, portable command-line tool written in Rust. Perfect for developers who need
                quick string manipulation, data conversions, and utility operations from the terminal.
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
                icon={FiTarget}
                title="Focused"
                description="Designed specifically for developer tasks, not everything"
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
              <Heading size="lg" mb={6} color="gray.800" _dark={{ color: 'gray.100' }}>
                Installation 📥
              </Heading>

              <VStack spacing={6} align="stretch">
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Heading size="md" mb={4} color="brand.600" _dark={{ color: 'brand.300' }}>
                    🔧 From Source
                  </Heading>
                  <Box bg="gray.900" p={4} borderRadius="md" overflow="auto">
                    <Code
                      display="block"
                      whiteSpace="pre"
                      color="green.300"
                      bg="transparent"
                      fontSize="sm"
                    >
{`git clone https://github.com/dhwaneetbhatt/strapd.git
cd strapd
cargo build --release

# Add to PATH
sudo cp target/release/strapd /usr/local/bin/`}
                    </Code>
                  </Box>
                </Box>

                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Heading size="md" mb={4} color="brand.600" _dark={{ color: 'brand.300' }}>
                    🚀 Quick Examples
                  </Heading>
                  <Box bg="gray.900" p={4} borderRadius="md" overflow="auto">
                    <Code
                      display="block"
                      whiteSpace="pre"
                      color="cyan.300"
                      bg="transparent"
                      fontSize="sm"
                    >
{`# Convert text to uppercase
strapd str upper "hello world"

# Generate a UUID
strapd uuid v4

# Create a URL slug
echo "Hello, World!" | strapd str slugify

# Pipe from stdin
echo "hello world" | strapd str upper`}
                    </Code>
                  </Box>
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Features List */}
            <Box>
              <Heading size="lg" mb={6} color="gray.800" _dark={{ color: 'gray.100' }}>
                Features (more coming soon) ✨
              </Heading>

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                {[
                  { icon: '🔤', title: 'String Tools', desc: 'case, trim, slugify, reverse, replace, analysis' },
                  { icon: '🆔', title: 'UUIDs', desc: 'v4, v7' },
                  { icon: '🔐', title: 'Encoding', desc: 'Base64, URL, Hex' },
                  { icon: '📊', title: 'Data Formatting', desc: 'JSON, XML, SQL' },
                  { icon: '🔄', title: 'YAML ⇄ JSON', desc: 'Bidirectional conversion' },
                  { icon: '🔒', title: 'Security', desc: 'Hash, HMAC' },
                  { icon: '🎲', title: 'Random', desc: 'numbers, strings' },
                  { icon: '🕒', title: 'Date/Time', desc: 'timestamps' },
                  { icon: '📋', title: 'Clipboard', desc: 'copy and paste' },
                ].map((feature, index) => (
                  <Box
                    key={index}
                    bg={cardBg}
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <HStack>
                      <Text fontSize="xl">{feature.icon}</Text>
                      <Box>
                        <Text fontWeight="semibold" color="brand.600" _dark={{ color: 'brand.300' }}>
                          {feature.title}
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
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
              <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                Licensed under the Apache License 2.0 |{' '}
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