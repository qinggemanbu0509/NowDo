const icons = {
  today: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9",
  tasks: "M4 11 8 5h8l4 6H4Zm0 0v4h16v-4M6 19h12",
  calendar:
    "M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3-2v4m8-4v4M4 10h16",
  insights: "M4 19v-3m5 3v-6m5 6v-4m5 4V9M4 12l5-5 5 3 5-6",
  settings:
    "M10 3h4l.6 2.5 2 .9 2.4-.8 2 3.4-1.8 1.7v2.6l1.8 1.7-2 3.4-2.4-.8-2 .9L14 21h-4l-.6-2.5-2-.9-2.4.8-2-3.4 1.8-1.7v-2.6L3 9l2-3.4 2.4.8 2-.9L10 3Zm2 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  book: "M12 6v14m0-14C9 4 6 4 3 5v13c3-1 6-1 9 2 3-3 6-3 9-2V5c-3-1-6-1-9 1Z",
  play: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2.5 5 6 4-6 4V8Z",
  check: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 12l2.5 2.5L16 9",
  chat: "M4 5h16v11H9l-5 4V5Zm4 5h8m-8 3h5",
  send: "M12 20V4m-6 6 6-6 6 6",
  sparkles: "M12 3c0 5-2 7-7 7 5 0 7 2 7 7 0-5 2-7 7-7-5 0-7-2-7-7Zm7 11v6m-3-3h6M5 15v4m-2-2h4",
  shield: "M12 22s7-3 7-9V6l-7-3-7 3v7c0 6 7 9 7 9Zm-3-10 2 2 4-4",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8h.01",
  code: "m8 7-5 5 5 5m8-10 5 5-5 5m-2-13-4 16",
  integrations: "M9 3v5m6-5v5M7 8h10v3a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V8Zm5 8v5",
  close: "m6 6 12 12M18 6 6 18",
  left: "m14 6-6 6 6 6",
  right: "m10 6 6 6-6 6",
} as const;

export function AppIcon({ name }: { name: keyof typeof icons }) {
  return (
    <svg
      className="app-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icons[name]} />
    </svg>
  );
}
