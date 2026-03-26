import ChatWidget from "@/components/chat/ChatWidget";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
