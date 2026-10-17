import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { LAYOUT_DEFINITIONS, getLayoutDefinition, type LayoutId } from "./layoutDefinitions";
import { PRESET_DEFINITIONS, TEMPLATE_DEFINITIONS, type PresetId, type TemplateId } from "./styleDefinitions";
import type { PhotoSession } from "../../types/photoSession";
import { renderComposition } from "../export/compositionService";
import { STICKER_DEFINITIONS, getStickerDefinition, type StickerId } from "./stickerDefinitions";
import { MAX_STICKERS, type StickerPlacement } from "../../types/photoSession";
import "./EditorPlaceholder.css";

interface EditorPlaceholderProps {
  session: PhotoSession;
  onBackToReview: () => void;
  onLayoutChange: (layoutId: LayoutId) => void;
  onPresetChange: (presetId: PresetId) => void;
  onTemplateChange: (templateId: TemplateId) => void;
  onAddSticker: (stickerId: StickerId) => void;
  onUpdateSticker: (instanceId: string, update: Partial<Pick<StickerPlacement, "x" | "y" | "width">>) => void;
  onRemoveSticker: (instanceId: string) => void;
  onPlaceLayoutPhoto: (layoutSlotIndex: number, sourceSlotIndex: number) => void;
  onReorderLayoutPhotos: (fromLayoutSlotIndex: number, toLayoutSlotIndex: number) => void;
  onPreviewFinal: () => void;
}

export function EditorPlaceholder({ session, onBackToReview, onLayoutChange, onPresetChange, onTemplateChange, onAddSticker, onUpdateSticker, onRemoveSticker, onPlaceLayoutPhoto, onReorderLayoutPhotos, onPreviewFinal }: EditorPlaceholderProps) {
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const selection = session.layoutPhotoSelections[layout.id];
  const [draggedLayoutSlotIndex, setDraggedLayoutSlotIndex] = useState<number | null>(null);
  const [draggedSourceSlotIndex, setDraggedSourceSlotIndex] = useState<number | null>(null);
  const [dropTargetLayoutSlotIndex, setDropTargetLayoutSlotIndex] = useState<number | null>(null);
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const interaction = useRef<{ instanceId: string; mode: "move" | "resize"; startX: number; startY: number; sticker: StickerPlacement } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let createdUrl: string | null = null;

    void renderComposition(session)
      .then((blob) => {
        if (!isCurrent) return;
        createdUrl = URL.createObjectURL(blob);
        setRenderedPreviewUrl(createdUrl);
        setPreviewError(null);
      })
      .catch(() => {
        if (isCurrent) setPreviewError("We could not render this composition yet. Your photos are still available to edit.");
      });

    return () => {
      isCurrent = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [session]);

  function clearDragState() {
    setDraggedLayoutSlotIndex(null);
    setDraggedSourceSlotIndex(null);
    setDropTargetLayoutSlotIndex(null);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, layoutSlotIndex: number) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-upsnap-layout-slot", String(layoutSlotIndex));
    setDraggedLayoutSlotIndex(layoutSlotIndex);
  }

  function handleTrayDragStart(event: DragEvent<HTMLDivElement>, sourceSlotIndex: number) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-upsnap-source-photo", String(sourceSlotIndex));
    setDraggedSourceSlotIndex(sourceSlotIndex);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, toLayoutSlotIndex: number) {
    event.preventDefault();
    const layoutSlotData = event.dataTransfer.getData("application/x-upsnap-layout-slot");
    const sourcePhotoData = event.dataTransfer.getData("application/x-upsnap-source-photo");

    if (layoutSlotData) {
      const fromLayoutSlotIndex = Number(layoutSlotData);
      if (Number.isInteger(fromLayoutSlotIndex)) {
        onReorderLayoutPhotos(fromLayoutSlotIndex, toLayoutSlotIndex);
      }
    } else if (sourcePhotoData) {
      const sourceSlotIndex = Number(sourcePhotoData);
      if (Number.isInteger(sourceSlotIndex)) {
        onPlaceLayoutPhoto(toLayoutSlotIndex, sourceSlotIndex);
      }
    }

    clearDragState();
  }

  function beginStickerInteraction(event: PointerEvent<HTMLElement>, sticker: StickerPlacement, mode: "move" | "resize") {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedStickerId(sticker.id);
    interaction.current = { instanceId: sticker.id, mode, startX: event.clientX, startY: event.clientY, sticker };
  }

  function handleStickerPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = interaction.current;
    if (!current) return;
    const preview = event.currentTarget.parentElement;
    if (!preview) return;
    const bounds = preview.getBoundingClientRect();
    if (current.mode === "move") {
      onUpdateSticker(current.instanceId, {
        x: current.sticker.x + (event.clientX - current.startX) / bounds.width,
        y: current.sticker.y + (event.clientY - current.startY) / bounds.height,
      });
    } else {
      onUpdateSticker(current.instanceId, { width: current.sticker.width + (event.clientX - current.startX) / bounds.width });
    }
  }

  function endStickerInteraction() { interaction.current = null; }

  function removeSticker(instanceId: string) {
    onRemoveSticker(instanceId);
    if (selectedStickerId === instanceId) setSelectedStickerId(null);
  }

  function handleStickerKeyDown(event: KeyboardEvent<HTMLDivElement>, sticker: StickerPlacement) {
    const nudge = event.shiftKey ? 0.05 : 0.02;
    if (event.key === "ArrowLeft") onUpdateSticker(sticker.id, { x: sticker.x - nudge });
    else if (event.key === "ArrowRight") onUpdateSticker(sticker.id, { x: sticker.x + nudge });
    else if (event.key === "ArrowUp") onUpdateSticker(sticker.id, { y: sticker.y - nudge });
    else if (event.key === "ArrowDown") onUpdateSticker(sticker.id, { y: sticker.y + nudge });
    else if (event.key === "Delete" || event.key === "Backspace") { removeSticker(sticker.id); return; }
    else return;
    event.preventDefault();
  }

  const selectedSticker = session.stickers.find((sticker) => sticker.id === selectedStickerId) ?? null;

  return <section className="editor-placeholder" aria-labelledby="editor-heading">
    <p className="stage-label">Compose your photos</p>
    <h2 id="editor-heading">Choose a layout</h2>
    <p>All {session.requiredPhotoCount} photos are saved. This {layout.capacity}-photo layout uses the selections below.</p>

    <div className="layout-selector" role="radiogroup" aria-label="Photo layout">
      {LAYOUT_DEFINITIONS.map((definition) => <button key={definition.id} type="button" role="radio" aria-checked={definition.id === layout.id} className={definition.id === layout.id ? "layout-option layout-option--selected" : "layout-option"} onClick={() => onLayoutChange(definition.id)}>{definition.label}<span>{definition.capacity} photos</span></button>)}
    </div>

    <div className="style-selectors">
      <label>Film preset
        <select value={session.selectedPresetId} onChange={(event) => onPresetChange(event.target.value as PresetId)}>
          {PRESET_DEFINITIONS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
        </select>
      </label>
    </div>

    <section className="template-selector" aria-labelledby="template-heading">
      <h3 id="template-heading">Template</h3>
      <div className="template-selector__options" role="radiogroup" aria-label="Composition template">
        {TEMPLATE_DEFINITIONS.map((template) => <button key={template.id} type="button" role="radio" aria-checked={template.id === session.selectedTemplateId} className={template.id === session.selectedTemplateId ? `template-option template-option--${template.id} template-option--selected` : `template-option template-option--${template.id}`} onClick={() => onTemplateChange(template.id)}>
          <span className="template-option__swatch" aria-hidden="true"><span /></span>
          <span>{template.label}</span>
        </button>)}
      </div>
    </section>

    <section className="sticker-selector" aria-labelledby="sticker-heading">
      <h3 id="sticker-heading">Stickers</h3>
      <p>Add up to {MAX_STICKERS} stickers, then drag a selected sticker anywhere on your composition.</p>
      <div className="sticker-selector__options" aria-label="Sticker catalog">
        {STICKER_DEFINITIONS.map((sticker) => <button key={sticker.id} type="button" onClick={() => onAddSticker(sticker.id)} disabled={session.stickers.length >= MAX_STICKERS}><img src={sticker.src} alt="" /><span>Add {sticker.label}</span></button>)}
      </div>
      {session.stickers.length >= MAX_STICKERS && <p className="sticker-selector__limit" role="status">Sticker limit reached. Remove a sticker to add another.</p>}
      {selectedSticker && <div className="sticker-controls" aria-label={`Controls for ${getStickerDefinition(selectedSticker.stickerId).label} sticker`}>
        <span>Selected: {getStickerDefinition(selectedSticker.stickerId).label}</span>
        <button type="button" onClick={() => onUpdateSticker(selectedSticker.id, { width: selectedSticker.width - 0.03 })}>Smaller</button>
        <button type="button" onClick={() => onUpdateSticker(selectedSticker.id, { width: selectedSticker.width + 0.03 })}>Larger</button>
        <button type="button" onClick={() => removeSticker(selectedSticker.id)}>Remove</button>
      </div>}
    </section>

    <section className="rendered-composition" aria-labelledby="rendered-composition-heading">
      <h3 id="rendered-composition-heading">Styled composition</h3>
      <p>This is the same rendering used for your final PNG.</p>
      {previewError && <p className="rendered-composition__error" role="alert">{previewError}</p>}
      {renderedPreviewUrl ? <div className="rendered-composition__canvas" style={{ aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}` }}><img src={renderedPreviewUrl} alt={`Styled ${layout.label} composition`} />{session.stickers.map((sticker) => {
        const definition = getStickerDefinition(sticker.stickerId);
        return <div key={sticker.id} className={sticker.id === selectedStickerId ? "sticker-overlay sticker-overlay--selected" : "sticker-overlay"} style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%`, width: `${sticker.width * 100}%`, aspectRatio: String(definition.aspectRatio) }} role="button" tabIndex={0} aria-label={`${definition.label} sticker. Drag to move; arrow keys to nudge; Delete to remove.`} onPointerDown={(event) => beginStickerInteraction(event, sticker, "move")} onPointerMove={handleStickerPointerMove} onPointerUp={endStickerInteraction} onPointerCancel={endStickerInteraction} onKeyDown={(event) => handleStickerKeyDown(event, sticker)}><span className="sticker-overlay__handle" aria-label={`Resize ${definition.label} sticker`} onPointerDown={(event) => beginStickerInteraction(event, sticker, "resize")} onPointerMove={handleStickerPointerMove} onPointerUp={endStickerInteraction} onPointerCancel={endStickerInteraction} /></div>;
      })}</div> : !previewError && <p role="status">Updating composition preview...</p>}
    </section>

    <p className="drag-instructions">Drag a photo in the preview onto another position to reorder it.</p>
    <div className="layout-preview" style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`, aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}` }} aria-label={`${layout.label} composition preview`}>
      {selection.map((sourceSlotIndex, layoutSlotIndex) => {
        const photo = session.photos[sourceSlotIndex];
        const className = [
          "layout-preview__slot",
          draggedLayoutSlotIndex === layoutSlotIndex && "layout-preview__slot--dragging",
          dropTargetLayoutSlotIndex === layoutSlotIndex && draggedLayoutSlotIndex !== layoutSlotIndex && "layout-preview__slot--drop-target",
        ].filter(Boolean).join(" ");
        return <div className={className} key={layoutSlotIndex} draggable onDragStart={(event) => handleDragStart(event, layoutSlotIndex)} onDragEnd={clearDragState} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTargetLayoutSlotIndex(layoutSlotIndex); }} onDragLeave={() => setDropTargetLayoutSlotIndex((current) => current === layoutSlotIndex ? null : current)} onDrop={(event) => handleDrop(event, layoutSlotIndex)} aria-label={`Photo ${sourceSlotIndex + 1}, position ${layoutSlotIndex + 1}. Draggable.`}>{photo && <img src={photo.dataUrl} draggable={false} alt={`Photo ${sourceSlotIndex + 1} in position ${layoutSlotIndex + 1}`} />}</div>;
      })}
    </div>

    <section className="photo-tray" aria-labelledby="photo-tray-heading">
      <h3 id="photo-tray-heading">Your photos</h3>
      <p>Drag a photo onto a layout position to use it there.</p>
      <div className="photo-tray__items">
        {session.photos.map((photo, sourceSlotIndex) => photo && <div className={draggedSourceSlotIndex === sourceSlotIndex ? "photo-tray__item photo-tray__item--dragging" : "photo-tray__item"} key={sourceSlotIndex} draggable onDragStart={(event) => handleTrayDragStart(event, sourceSlotIndex)} onDragEnd={clearDragState} aria-label={`Photo ${sourceSlotIndex + 1}${selection.includes(sourceSlotIndex) ? ", currently in layout" : ", available to add"}. Draggable.`}>
          <img src={photo.dataUrl} draggable={false} alt={`Captured photo ${sourceSlotIndex + 1}`} />
          <span>Photo {sourceSlotIndex + 1}</span>
        </div>)}
      </div>
    </section>
    <div className="editor-actions">
      <button type="button" onClick={onBackToReview}>Back to review</button>
      <button type="button" onClick={onPreviewFinal}>Preview final image</button>
    </div>
  </section>;
}
