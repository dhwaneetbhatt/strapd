import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  FiCopy,
  FiDownload,
  FiEdit3,
  FiGitMerge,
  FiMoreVertical,
  FiPlay,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { Layout } from "../components/layout";
import {
  PipeEditInspector,
  PipeEditor,
  PipeRunner,
  SavedPipesRail,
} from "../components/pipes";
import { usePipeWorkspace } from "../hooks/use-pipe-workspace";
import { useUnsavedNavigationGuard } from "../hooks/use-unsaved-navigation-guard";

const IMPORT_INPUT_ID = "pipe-import-input";

export const Pipes: React.FC = () => {
  const workspace = usePipeWorkspace();
  const {
    isOpen: isDeleteOpen,
    onOpen: openDelete,
    onClose: closeDelete,
  } = useDisclosure();
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const conflictCancelRef = useRef<HTMLButtonElement>(null);
  const navigationCancelRef = useRef<HTMLButtonElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const navigationGuard = useUnsavedNavigationGuard(
    workspace.hasUnsavedChanges,
  );

  useEffect(() => {
    setRenameValue(workspace.selectedPipe?.name ?? "");
    setIsRenaming(false);
  }, [workspace.selectedPipe?.name]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const runnerIsVisible =
        workspace.mode === "run" ||
        (workspace.mode === "edit" && !workspace.isNew);
      if (
        runnerIsVisible &&
        workspace.canRun &&
        (event.metaKey || event.ctrlKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        void workspace.run();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [workspace.canRun, workspace.isNew, workspace.mode, workspace.run]);

  const confirmRename = () => {
    if (workspace.rename(renameValue)) setIsRenaming(false);
  };

  const confirmDelete = () => {
    workspace.deleteSelected();
    closeDelete();
  };

  const selectedListItem = workspace.pipes.find(
    ({ id }) => id === workspace.selectedPipeId,
  );

  return (
    <Layout onNavigationRequest={navigationGuard.requestNavigation}>
      <Flex
        minH="calc(100vh - 73px)"
        direction={{ base: "column", lg: "row" }}
        bg="surface.base"
      >
        <Box
          display={{
            base: workspace.mode === "edit" ? "none" : "block",
            lg: "block",
          }}
        >
          <SavedPipesRail
            pipes={workspace.pipes}
            selectedPipeId={workspace.selectedPipeId}
            onSelect={workspace.selectPipe}
            onCreate={workspace.startCreate}
            onImport={workspace.importFile}
            isBusy={workspace.mode === "edit"}
            importInputId={IMPORT_INPUT_ID}
          />
        </Box>

        <Box as="main" flex={1} minW={0} p={{ base: 4, md: 6 }}>
          <VisuallyHidden aria-live="polite">
            {workspace.stepAnnouncement}
          </VisuallyHidden>
          {workspace.error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <AlertDescription flex={1}>{workspace.error}</AlertDescription>
              <IconButton
                aria-label="Dismiss error"
                icon={<FiX />}
                variant="ghost"
                size="sm"
                onClick={workspace.clearError}
              />
            </Alert>
          )}

          {workspace.mode === "edit" &&
          workspace.workingCopy &&
          workspace.isNew ? (
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading as="h1" size="lg">
                  Create pipe
                </Heading>
                <Text color="text.secondary" fontSize="sm" mt={1}>
                  Configure each step once. Saved values remain frozen during
                  runs.
                </Text>
              </Box>
              <PipeEditor
                name={workspace.workingCopy.name}
                steps={workspace.steps}
                tools={workspace.availableTools}
                selectedStepId={workspace.selectedStepId}
                validation={workspace.validation}
                onNameChange={workspace.setDraftName}
                onAddStep={workspace.addStep}
                onSelectStep={workspace.setSelectedStepId}
                onConfigChange={workspace.changeConfig}
                onMoveStep={workspace.moveStep}
                onRemoveStep={workspace.removeStep}
                onSave={workspace.saveEdit}
                onCancel={workspace.cancelEdit}
              />
            </VStack>
          ) : workspace.mode === "edit" && workspace.workingCopy ? (
            <VStack align="stretch" spacing={5}>
              <Box>
                <Heading as="h1" size="lg">
                  Edit {workspace.selectedPipe?.name ?? "pipe"}
                </Heading>
                <Text color="text.secondary" fontSize="sm" mt={1}>
                  The saved runner stays available while you adjust the working
                  copy. Changes take effect only after saving.
                </Text>
              </Box>
              <Grid
                templateColumns={{
                  base: "minmax(0, 1fr)",
                  xl: "minmax(0, 1fr) 320px",
                }}
                gap={5}
                alignItems="start"
              >
                <Box minW={0} order={{ base: 2, xl: 1 }}>
                  <PipeRunner
                    pipeName={workspace.selectedPipe?.name ?? "pipe"}
                    steps={workspace.steps}
                    requiresInput={workspace.requiresInput}
                    input={workspace.input}
                    output={workspace.output}
                    runState={workspace.runState}
                    canRun={workspace.canRun}
                    isEditing
                    activeStepId={workspace.selectedStepId}
                    onSelectStep={workspace.setSelectedStepId}
                    onInputChange={workspace.setInput}
                    onRun={() => void workspace.run()}
                    onReset={workspace.resetRun}
                  />
                </Box>
                <Box order={{ base: 1, xl: 2 }}>
                  <PipeEditInspector
                    name={workspace.workingCopy.name}
                    steps={workspace.steps}
                    tools={workspace.availableTools}
                    selectedStepId={workspace.selectedStepId}
                    validation={workspace.validation}
                    onNameChange={workspace.setDraftName}
                    onAddStep={workspace.addStep}
                    onConfigChange={workspace.changeConfig}
                    onMoveStep={workspace.moveStep}
                    onRemoveStep={workspace.removeStep}
                    onSave={workspace.saveEdit}
                    onCancel={workspace.cancelEdit}
                  />
                </Box>
              </Grid>
            </VStack>
          ) : workspace.selectedPipe ? (
            <VStack align="stretch" spacing={5}>
              <Flex
                align={{ base: "stretch", md: "center" }}
                justify="space-between"
                direction={{ base: "column", md: "row" }}
                gap={3}
              >
                <Box minW={0}>
                  {isRenaming ? (
                    <>
                      <VisuallyHidden>
                        <Heading as="h1">{workspace.selectedPipe.name}</Heading>
                      </VisuallyHidden>
                      <HStack>
                        <Input
                          aria-label="Pipe name"
                          value={renameValue}
                          onChange={(event) =>
                            setRenameValue(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") confirmRename();
                            if (event.key === "Escape") setIsRenaming(false);
                          }}
                          autoFocus
                          maxW="420px"
                        />
                        <Button onClick={confirmRename} size="sm">
                          Save name
                        </Button>
                        <IconButton
                          aria-label="Cancel rename"
                          icon={<FiX />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsRenaming(false)}
                        />
                      </HStack>
                    </>
                  ) : (
                    <HStack align="baseline" spacing={4} flexWrap="wrap">
                      <Heading as="h1" size="lg" noOfLines={1}>
                        {workspace.selectedPipe.name}
                      </Heading>
                      <Text fontSize="sm" color="text.secondary">
                        {selectedListItem?.updatedAt}
                      </Text>
                    </HStack>
                  )}
                </Box>

                <HStack spacing={2} flexWrap="wrap">
                  <Button
                    leftIcon={<FiPlay />}
                    onClick={() => void workspace.run()}
                    isLoading={workspace.runState.status === "running"}
                    loadingText="Running"
                    isDisabled={!workspace.canRun}
                  >
                    Run
                  </Button>
                  <Button
                    leftIcon={<FiEdit3 />}
                    variant="outline"
                    onClick={workspace.startEdit}
                  >
                    Edit
                  </Button>
                  <Button
                    leftIcon={<FiDownload />}
                    variant="outline"
                    onClick={workspace.exportSelected}
                    display={{ base: "none", md: "inline-flex" }}
                  >
                    Export
                  </Button>
                  <Button
                    leftIcon={<FiCopy />}
                    variant="outline"
                    onClick={workspace.duplicate}
                    display={{ base: "none", xl: "inline-flex" }}
                  >
                    Duplicate
                  </Button>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="More pipe actions"
                      icon={<FiMoreVertical />}
                      variant="ghost"
                    />
                    <MenuList>
                      <MenuItem
                        icon={<FiEdit3 />}
                        onClick={() => setIsRenaming(true)}
                      >
                        Rename
                      </MenuItem>
                      <MenuItem
                        icon={<FiDownload />}
                        onClick={workspace.exportSelected}
                        display={{ md: "none" }}
                      >
                        Export
                      </MenuItem>
                      <MenuItem
                        icon={<FiCopy />}
                        onClick={workspace.duplicate}
                        display={{ xl: "none" }}
                      >
                        Duplicate
                      </MenuItem>
                      <MenuItem
                        icon={<FiTrash2 />}
                        color="text.error"
                        onClick={openDelete}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>

              {!selectedListItem?.isRunnable && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    This pipe contains an unavailable or incompatible step. Edit
                    the pipe to resolve it before running.
                  </AlertDescription>
                </Alert>
              )}

              <PipeRunner
                pipeName={workspace.selectedPipe.name}
                steps={workspace.steps}
                requiresInput={workspace.requiresInput}
                input={workspace.input}
                output={workspace.output}
                runState={workspace.runState}
                canRun={workspace.canRun}
                onInputChange={workspace.setInput}
                onRun={() => void workspace.run()}
                onReset={workspace.resetRun}
              />
            </VStack>
          ) : (
            <Flex
              minH="65vh"
              align="center"
              justify="center"
              textAlign="center"
            >
              <VStack spacing={5} maxW="520px" p={8}>
                <Box
                  display="grid"
                  placeItems="center"
                  w={12}
                  h={12}
                  borderRadius="md"
                  bg="bg.selected"
                  color="text.brand"
                >
                  <Icon as={FiGitMerge} boxSize={6} />
                </Box>
                <Box>
                  <Heading as="h1" size="lg">
                    Build a repeatable pipe
                  </Heading>
                  <Text color="text.secondary" mt={2} lineHeight="tall">
                    Chain compatible tools in one linear sequence. The output of
                    each step becomes the input to the next, and configuration
                    stays frozen until you edit it.
                  </Text>
                </Box>
                <HStack flexWrap="wrap" justify="center">
                  <Button
                    leftIcon={<FiGitMerge />}
                    onClick={workspace.startCreate}
                  >
                    Create pipe
                  </Button>
                  <Button
                    leftIcon={<FiUpload />}
                    variant="outline"
                    onClick={() =>
                      document.getElementById(IMPORT_INPUT_ID)?.click()
                    }
                  >
                    Import JSON
                  </Button>
                </HStack>
              </VStack>
            </Flex>
          )}
        </Box>
      </Flex>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={deleteCancelRef}
        onClose={closeDelete}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete this pipe?</AlertDialogHeader>
            <AlertDialogBody>
              {workspace.selectedPipe?.name} will be removed from this browser.
              This cannot be undone unless you exported a copy.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={deleteCancelRef}
                variant="ghost"
                onClick={closeDelete}
              >
                Cancel
              </Button>
              <Button colorScheme="red" ml={3} onClick={confirmDelete}>
                Delete pipe
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={Boolean(workspace.importConflict)}
        leastDestructiveRef={conflictCancelRef}
        onClose={workspace.dismissImportConflict}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Pipe already exists</AlertDialogHeader>
            <AlertDialogBody>
              A local pipe and the imported pipe share the same stable ID.
              Replace the local definition or import a copy with new pipe and
              step IDs.
              {workspace.importConflictError && (
                <Alert
                  status="error"
                  mt={4}
                  role="alert"
                  alignItems="flex-start"
                >
                  <AlertIcon mt={0.5} />
                  <AlertDescription>
                    <Text fontWeight="semibold">Import was not saved</Text>
                    <Text>{workspace.importConflictError}</Text>
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogBody>
            <AlertDialogFooter gap={2} flexWrap="wrap">
              <Button
                ref={conflictCancelRef}
                variant="ghost"
                onClick={workspace.dismissImportConflict}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => workspace.resolveConflict("copy")}
              >
                Import as copy
              </Button>
              <Button onClick={() => workspace.resolveConflict("replace")}>
                Replace existing
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={navigationGuard.isNavigationBlocked}
        leastDestructiveRef={navigationCancelRef}
        onClose={navigationGuard.cancelNavigation}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Leave without saving?</AlertDialogHeader>
            <AlertDialogBody>
              Your pipe changes have not been saved. Leaving this page will
              discard the working copy.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={navigationCancelRef}
                variant="ghost"
                onClick={navigationGuard.cancelNavigation}
              >
                Stay and keep editing
              </Button>
              <Button
                colorScheme="red"
                ml={3}
                onClick={navigationGuard.confirmNavigation}
              >
                Leave without saving
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};
