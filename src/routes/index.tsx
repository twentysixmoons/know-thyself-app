import { createFileRoute } from "@tanstack/react-router";
import { Cover } from "./cover";

// The app's home page IS the diary cover — no separate landing screen.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Know Thyself — Body, mind, & spirit diary" }],
  }),
  component: Cover,
});
