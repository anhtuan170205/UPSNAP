export const STICKER_DEFINITIONS = [
  { id: "star", label: "Star", src: "/stickers/star.svg", aspectRatio: 1 },
  { id: "heart", label: "Heart", src: "/stickers/heart.svg", aspectRatio: 1 },
  { id: "sparkle", label: "Sparkle", src: "/stickers/sparkle.svg", aspectRatio: 1 },
  { id: "smiley", label: "Smiley", src: "/stickers/smiley.svg", aspectRatio: 1 },
  { id: "party-hat", label: "Party hat", src: "/stickers/party-hat.svg", aspectRatio: 0.86 },
  { id: "bow", label: "Bow", src: "/stickers/bow.svg", aspectRatio: 1.3 },
  { id: "speech-bubble", label: "Speech bubble", src: "/stickers/speech-bubble.svg", aspectRatio: 1.3 },
] as const;

export type StickerId = (typeof STICKER_DEFINITIONS)[number]["id"];
export type StickerDefinition = (typeof STICKER_DEFINITIONS)[number];

export function getStickerDefinition(stickerId: StickerId): StickerDefinition {
  const sticker = STICKER_DEFINITIONS.find(({ id }) => id === stickerId);
  if (!sticker) throw new Error(`Unknown sticker: ${stickerId}`);
  return sticker;
}
