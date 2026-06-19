// Embeds a Jitsi Meet room by slug. The slug is the room name (and the secret
// capability). Provider-agnostic boundary: swap this component for a LiveKit /
// Daily embed later without touching the room-management layer.

export function JitsiEmbed({ slug }: { slug: string }) {
  const src = `https://meet.jit.si/${encodeURIComponent(slug)}`;
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-black"
      style={{ height: "72vh" }}
    >
      <iframe
        title="Live classroom"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="h-full w-full"
        style={{ border: 0 }}
      />
    </div>
  );
}
