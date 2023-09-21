import { Button, Modal, SegmentedControl, Select, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { cloneElement, ReactElement, useEffect, useState } from "react";
import { Chat, detaDB } from "../db";
import { useChat, useChats, usePrompts } from "../hooks/contexts";
import { config } from "../utils/config";

export function SelectIntegrationModal({
  chat,
  children,
}: {
  chat: Chat;
  children: ReactElement;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const { prompts } = usePrompts()
  const { setChats } = useChats()
  const { setChat } = useChat()

  const [promptKey, setPromptKey] = useState<string | null>(null);

  const [writingInstructions, setWritingInstructions] = useState<string | null>(null);
  const [writingCharacter, setWritingCharacter] = useState<string | null>(null);
  const [writingTone, setWritingTone] = useState<string | null>(null);
  const [writingStyle, setWritingStyle] = useState<string | null>(null);
  const [writingFormat, setWritingFormat] = useState<string | null>(null);
  const [model, setModel] = useState<string>('default');

  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(chat?.description ?? "");
    setModel(chat.model ?? 'default')
    setWritingInstructions(chat.writingInstructions ?? null)
    setWritingCharacter(chat.writingCharacter ?? null)
    setWritingTone(chat.writingTone ?? null)
    setWritingStyle(chat.writingStyle ?? null)
    setWritingFormat(chat.writingFormat ?? null)

    if (chat.prompt) {
      setPromptKey(chat.prompt)
    } else {
      setPromptKey(null)
    }
  }, [chat, opened]);

  useEffect(() => {
    const prompt = prompts.find(prompt => prompt.key === promptKey)
    if (prompt) {
      setWritingInstructions(prompt.content ?? null)
      setWritingCharacter(prompt.writingCharacter ?? null)
      setWritingTone(prompt.writingTone ?? null)
      setWritingStyle(prompt.writingStyle ?? null)
      setWritingFormat(prompt.writingFormat ?? null)
    }
  }, [promptKey]);

  useEffect(() => {
    const prompt = prompts.find(prompt => prompt.key === promptKey)
    if (prompt) {
      // compare current values with saved values and update if different
      if (prompt.content !== writingInstructions
        || prompt.writingCharacter !== writingCharacter
        || prompt.writingTone !== writingTone
        || prompt.writingStyle !== writingStyle
        || prompt.writingFormat !== writingFormat
      ) {
        setPromptKey(null)
      }
    }
  }, [writingInstructions, writingCharacter, writingFormat, writingStyle, writingTone]);

  // const handleClose = () => {
  //   close()
  //   setPromptKey(null)
  //   setWritingInstructions(null)
  //   setWritingCharacter(null)
  //   setWritingTone(null)
  //   setWritingStyle(null)
  //   setWritingFormat(null)
  //   setModel('default')
  // }

  return (
    <>
      {cloneElement(children, { onClick: open })}
      <Modal opened={opened} onClose={close} title="Select Integration" withinPortal size="lg">
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();

              const updates: Partial<Chat> = {
                description: value,
                prompt: promptKey,
                writingInstructions,
                writingCharacter,
                writingFormat,
                writingStyle,
                writingTone,
                model: model === 'default' ? null : model,
              }

              await detaDB.chats.update(updates, chat.key);
              setChats(current => (current || []).map(item => {
                if (item.key === chat.key) {
                  return { ...item, ...updates };
                }
          
                return item;
              }));
              setChat(current => {
                if (current?.key === chat.key) {
                  return { ...current, ...updates };
                }
          
                return current;
              })

              notifications.show({
                title: "Saved",
                color: "green",
                message: "Chat updated.",
              });
              close();
            } catch (error: any) {
              if (error.toJSON().message === "Network Error") {
                notifications.show({
                  title: "Error",
                  color: "red",
                  message: "No internet connection.",
                });
              }
              const message = error.response?.data?.error?.message;
              if (message) {
                notifications.show({
                  title: "Error",
                  color: "red",
                  message,
                });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Stack>
            <Select
              value={promptKey}
              onChange={setPromptKey}
              data={prompts.map(prompt => ({ value: prompt.key, label: prompt.title }))}
              placeholder="Select Integration"
              variant="filled"
              searchable
              clearable
            />
            <Button type="submit" loading={submitting}>
              Send to App
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}