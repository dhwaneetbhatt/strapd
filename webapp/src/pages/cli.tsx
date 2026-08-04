import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  Link,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { forwardRef, useRef } from "react";
import {
  FiBox,
  FiCheckCircle,
  FiDownload,
  FiGithub,
  FiLock,
  FiRepeat,
  FiSearch,
  FiTerminal,
} from "react-icons/fi";
import { CopyButton } from "../components/common";
import { Layout } from "../components/layout";
import { usePageMetadata } from "../hooks/use-page-metadata";

const repositoryUrl = "https://github.com/dhwaneetbhatt/strapd";
const cliPageUrl = "https://dhwaneetbhatt.com/strapd/#/cli";
const cliPageTitle = "strapd CLI — Offline Developer Toolkit";
const cliPageDescription =
  "Install strapd, an offline Rust CLI for JSON, JWT, encoding, hashing, UUIDs, strings, and more. Compose commands through stdin and stdout.";
const cliStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "strapd",
  description: cliPageDescription,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  url: cliPageUrl,
  downloadUrl: `${repositoryUrl}/releases`,
  sameAs: repositoryUrl,
  license: "https://www.apache.org/licenses/LICENSE-2.0",
});
const heroCommand = `echo '{"name":"Ada","active":true}' \\
  | strapd json minify --sort \\
  | strapd base64 encode`;
const heroOutput = "eyJhY3RpdmUiOnRydWUsIm5hbWUiOiJBZGEifQo=";
const homebrewCommand = `brew tap dhwaneetbhatt/tap
brew install strapd`;
const unixInstallCommand =
  "curl -fsSL https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.sh | bash";
const windowsInstallCommand =
  'Invoke-RestMethod -Uri "https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.ps1" | Invoke-Expression';
const sourceInstallCommand = `git clone https://github.com/dhwaneetbhatt/strapd.git
cd strapd
make cli-release
sudo ln -s $(pwd)/target/release/strapd /usr/local/bin/strapd`;

interface CommandBlockProps {
  command: string;
  copyLabel: string;
  output?: string;
}

const CommandBlock: React.FC<CommandBlockProps> = ({
  command,
  copyLabel,
  output,
}) => (
  <Box
    bg="surface.muted"
    borderRadius="md"
    border="1px solid"
    borderColor="border.base"
    minW={0}
    overflow="hidden"
  >
    <HStack
      justify="space-between"
      px={{ base: 3, sm: 4 }}
      py={2}
      borderBottom="1px solid"
      borderColor="border.base"
    >
      <Text fontSize="xs" fontWeight="semibold" color="text.secondary">
        Command
      </Text>
      <CopyButton value={command} size="sm" aria-label={copyLabel} />
    </HStack>
    <Box overflowX="auto" maxW="100%" p={{ base: 3, sm: 4 }}>
      <Box
        as="pre"
        m={0}
        minW="max-content"
        fontFamily="mono"
        fontSize="sm"
        lineHeight="tall"
        color="text.primary"
      >
        {command}
      </Box>
      {output && (
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="border.base">
          <Text
            mb={2}
            fontSize="xs"
            fontWeight="semibold"
            color="text.secondary"
          >
            Output
          </Text>
          <Box
            as="pre"
            m={0}
            minW="max-content"
            fontFamily="mono"
            fontSize="sm"
            color="text.primary"
          >
            {output}
          </Box>
        </Box>
      )}
    </Box>
  </Box>
);

interface CapabilityProps {
  icon: React.ComponentType;
  title: string;
  description: string;
}

const Capability: React.FC<CapabilityProps> = ({
  icon,
  title,
  description,
}) => (
  <Box borderTop="1px solid" borderColor="border.base" pt={5} minW={0}>
    <HStack align="start" spacing={3}>
      <Icon as={icon} mt={1} boxSize={5} color="text.brand" flexShrink={0} />
      <Box minW={0}>
        <Heading size="sm" mb={2} color="text.primary">
          {title}
        </Heading>
        <Text color="text.secondary">{description}</Text>
      </Box>
    </HStack>
  </Box>
);

const InstallerSourceLink: React.FC<{ href: string }> = ({ href }) => (
  <Link
    href={href}
    isExternal
    rel="noopener noreferrer"
    color="text.brand"
    fontWeight="medium"
  >
    Review installer source <ExternalLinkIcon mx="2px" />
  </Link>
);

interface SectionBandProps {
  background: string;
  children: React.ReactNode;
  compact?: boolean;
  id?: string;
  separated?: boolean;
}

const SectionBand = forwardRef<HTMLDivElement, SectionBandProps>(
  ({ background, children, compact = false, id, separated = false }, ref) => (
    <Box
      as="section"
      id={id}
      ref={ref}
      bg={background}
      borderY={separated ? "1px solid" : undefined}
      borderColor={separated ? "border.base" : undefined}
      scrollMarginTop="72px"
    >
      <Container
        maxW="6xl"
        px={{ base: 4, sm: 6 }}
        py={compact ? { base: 8, md: 10 } : { base: 12, md: 18 }}
      >
        {children}
      </Container>
    </Box>
  ),
);

SectionBand.displayName = "SectionBand";

export const CLI: React.FC = () => {
  const installationRef = useRef<HTMLDivElement>(null);

  usePageMetadata({
    canonicalUrl: cliPageUrl,
    description: cliPageDescription,
    structuredData: cliStructuredData,
    title: cliPageTitle,
  });

  const scrollToInstallation = () => {
    installationRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout>
      <Box minH="calc(100vh - 80px)" bg="surface.raised" overflowX="hidden">
        <SectionBand background="surface.raised">
          <Grid
            templateColumns={{
              base: "minmax(0, 1fr)",
              lg: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            }}
            gap={{ base: 10, lg: 14 }}
            alignItems="center"
            minW={0}
          >
            <Box minW={0}>
              <Heading
                as="h1"
                size="2xl"
                maxW="12ch"
                mb={5}
                color="text.primary"
                letterSpacing="-0.025em"
              >
                One utility belt for everyday developer work.
              </Heading>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="text.secondary"
                maxW="60ch"
                mb={7}
              >
                Format, inspect, encode, generate, and validate without
                switching websites or writing another throwaway script. strapd
                runs locally and composes through stdin and stdout.
              </Text>
              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={3}
                align={{ base: "stretch", sm: "center" }}
              >
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="brand"
                  size="lg"
                  onClick={scrollToInstallation}
                >
                  Install strapd
                </Button>
                <Button
                  as="a"
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<FiGithub />}
                  rightIcon={<ExternalLinkIcon />}
                  variant="outline"
                  size="lg"
                >
                  View source
                </Button>
              </Stack>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mt={8}>
                <HStack spacing={2}>
                  <Icon as={FiLock} color="text.brand" />
                  <Text fontSize="sm" color="text.secondary">
                    Works offline
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiRepeat} color="text.brand" />
                  <Text fontSize="sm" color="text.secondary">
                    stdin → stdout
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiBox} color="text.brand" />
                  <Text fontSize="sm" color="text.secondary">
                    Shared Rust core
                  </Text>
                </HStack>
              </SimpleGrid>
            </Box>

            <Box minW={0}>
              <HStack mb={3} justify="space-between">
                <HStack spacing={2}>
                  <Icon as={FiTerminal} color="text.brand" />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="text.primary"
                  >
                    A real strapd pipeline
                  </Text>
                </HStack>
                <Badge colorScheme="brand" variant="subtle">
                  Runs locally
                </Badge>
              </HStack>
              <CommandBlock
                command={heroCommand}
                output={heroOutput}
                copyLabel="Copy example pipeline"
              />
              <Text mt={3} fontSize="sm" color="text.secondary">
                Sort and minify JSON, then Base64-encode the result. Each stage
                emits clean output for the next command.
              </Text>
            </Box>
          </Grid>
        </SectionBand>

        <SectionBand background="surface.base" separated>
          <Box>
            <Heading size="lg" mb={3} color="text.primary">
              Keep the common 80% close at hand
            </Heading>
            <Text color="text.secondary" maxW="68ch" mb={8}>
              Learn one consistent interface for the small transformations,
              inspections, and generators that interrupt larger work.
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 3 }}
              spacing={{ base: 7, md: 8 }}
            >
              <Capability
                icon={FiRepeat}
                title="Transform"
                description="Work with strings, JSON, YAML, XML, SQL, Base64, URL encoding, and Hex."
              />
              <Capability
                icon={FiSearch}
                title="Inspect and validate"
                description="Analyze timestamps, calculate hashes and HMACs, and decode, verify, or sign JWTs."
              />
              <Capability
                icon={FiBox}
                title="Generate"
                description="Create UUIDs, ULIDs, random values, and other inputs without leaving the terminal."
              />
            </SimpleGrid>
          </Box>
        </SectionBand>

        <SectionBand
          background="surface.raised"
          id="installation"
          ref={installationRef}
        >
          <Heading size="xl" mb={3} color="text.primary">
            Install strapd
          </Heading>
          <Text color="text.secondary" maxW="65ch" mb={8}>
            Homebrew is the recommended path on macOS and Linux. Choose a
            different method when it better fits your environment.
          </Text>

          <Tabs colorScheme="brand" variant="enclosed" isLazy minW={0}>
            <Box overflowX="auto" maxW="100%">
              <TabList minW="max-content">
                <Tab>Homebrew</Tab>
                <Tab>Install script</Tab>
                <Tab>Windows</Tab>
              </TabList>
            </Box>
            <TabPanels
              bg="surface.raised"
              border="1px solid"
              borderColor="border.base"
              borderTopWidth={0}
              borderBottomRadius="lg"
            >
              <TabPanel p={{ base: 4, md: 6 }}>
                <HStack mb={3} spacing={3} flexWrap="wrap">
                  <Heading size="md">Homebrew</Heading>
                  <Badge colorScheme="brand">Recommended</Badge>
                </HStack>
                <Text color="text.secondary" mb={5}>
                  For macOS and Linux. Add the strapd tap, then install the
                  formula.
                </Text>
                <CommandBlock
                  command={homebrewCommand}
                  copyLabel="Copy Homebrew installation commands"
                />
              </TabPanel>
              <TabPanel p={{ base: 4, md: 6 }}>
                <Heading size="md" mb={3}>
                  Unix install script
                </Heading>
                <Text color="text.secondary" mb={3}>
                  For macOS and Linux. Review the script before piping it to
                  your shell.
                </Text>
                <Box mb={5}>
                  <InstallerSourceLink
                    href={`${repositoryUrl}/blob/main/scripts/install.sh`}
                  />
                </Box>
                <CommandBlock
                  command={unixInstallCommand}
                  copyLabel="Copy Unix installation command"
                />
                <Text mt={4} fontSize="sm" color="text.secondary">
                  The script downloads the matching release to{" "}
                  <Box as="code" fontFamily="mono">
                    /usr/local/bin/strapd
                  </Box>{" "}
                  by default. It requires curl and tar, may request sudo, and
                  accepts a custom STRAPD_INSTALL_DIR.
                </Text>
              </TabPanel>
              <TabPanel p={{ base: 4, md: 6 }}>
                <Heading size="md" mb={3}>
                  PowerShell install script
                </Heading>
                <Text color="text.secondary" mb={3}>
                  For Windows. Review the script before evaluating it in
                  PowerShell.
                </Text>
                <Box mb={5}>
                  <InstallerSourceLink
                    href={`${repositoryUrl}/blob/main/scripts/install.ps1`}
                  />
                </Box>
                <CommandBlock
                  command={windowsInstallCommand}
                  copyLabel="Copy Windows installation command"
                />
                <Text mt={4} fontSize="sm" color="text.secondary">
                  The script installs{" "}
                  <Box as="code" fontFamily="mono">
                    strapd.exe
                  </Box>{" "}
                  under{" "}
                  <Box as="code" fontFamily="mono">
                    $env:USERPROFILE\.strapd
                  </Box>{" "}
                  by default and adds that directory to the user PATH.
                </Text>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Accordion allowToggle mt={6} borderColor="border.base">
            <AccordionItem>
              <Heading as="h3">
                <AccordionButton px={{ base: 2, sm: 4 }} py={4}>
                  <Box
                    as="span"
                    flex="1"
                    textAlign="left"
                    fontWeight="semibold"
                  >
                    Other installation methods
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </Heading>
              <AccordionPanel px={{ base: 2, sm: 4 }} pb={6}>
                <VStack align="stretch" spacing={7}>
                  <Box>
                    <Heading size="sm" mb={2}>
                      Manual download
                    </Heading>
                    <Text color="text.secondary">
                      Download a pre-built binary from the{" "}
                      <Link
                        href={`${repositoryUrl}/releases`}
                        isExternal
                        rel="noopener noreferrer"
                        color="text.brand"
                        fontWeight="medium"
                      >
                        GitHub releases <ExternalLinkIcon mx="2px" />
                      </Link>
                      .
                    </Text>
                  </Box>
                  <Box>
                    <Heading size="sm" mb={2}>
                      Build from source
                    </Heading>
                    <Text color="text.secondary" mb={4}>
                      Clone the repository, build the release binary, and link
                      it into your path.
                    </Text>
                    <CommandBlock
                      command={sourceInstallCommand}
                      copyLabel="Copy source installation commands"
                    />
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </SectionBand>

        <SectionBand background="surface.base" separated>
          <Box>
            <Heading size="lg" mb={3} color="text.primary">
              Verify it, then use it
            </Heading>
            <Text color="text.secondary" maxW="65ch" mb={7}>
              Confirm the binary is available, generate a timestamp-sortable
              UUID, then explore the complete command tree.
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              <CommandBlock
                command="strapd --version"
                copyLabel="Copy version command"
              />
              <CommandBlock
                command="strapd uuid v7"
                copyLabel="Copy UUID command"
              />
              <CommandBlock
                command="strapd --help"
                copyLabel="Copy help command"
              />
            </SimpleGrid>
            <HStack mt={7} spacing={2} align="start">
              <Icon
                as={FiCheckCircle}
                mt={1}
                color="text.brand"
                flexShrink={0}
              />
              <Text color="text.secondary">
                If your shell cannot find strapd after installation, open a new
                terminal and run the version command again. For installer
                problems, check the{" "}
                <Link
                  href={`${repositoryUrl}/issues`}
                  isExternal
                  rel="noopener noreferrer"
                  color="text.brand"
                  fontWeight="medium"
                >
                  issue tracker <ExternalLinkIcon mx="2px" />
                </Link>
                .
              </Text>
            </HStack>
          </Box>
        </SectionBand>

        <SectionBand background="surface.raised" compact>
          <Stack
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            spacing={4}
            pb={4}
          >
            <Text color="text.secondary">Apache License 2.0</Text>
            <Button
              as="a"
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="link"
              color="text.brand"
              rightIcon={<ExternalLinkIcon />}
            >
              Read the source on GitHub
            </Button>
          </Stack>
        </SectionBand>
      </Box>
    </Layout>
  );
};
