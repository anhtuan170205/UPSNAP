import { useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { LAYOUT_DEFINITIONS, getLayoutDefinition, type LayoutId } from "./layoutDefinitions";
import { PRESET_DEFINITIONS, TEMPLATE_DEFINITIONS, type PresetId, type TemplateId } from "./styleDefinitions";
import { MAX_STICKERS, type PhotoSession, type StickerPlacement } from "../../types/photoSession";
import { downloadPng, getCompositionFilename } from "../export/compositionService";
import { STICKER_DEFINITIONS, getStickerDefinition, type StickerId } from "./stickerDefinitions";
import { useCompositionPreview } from "../../hooks/useCompositionPreview";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import "./PhotoEditor.css";

interface PhotoEditorProps {
  session: PhotoSession;
  onBackToReview: () => void;
  onLayoutChange: (id: LayoutId) => void;
  onPresetChange: (id: PresetId) => void;
  onTemplateChange: (id: TemplateId) => void;
  onAddSticker: (id: StickerId) => void;
  onUpdateSticker: (id: string, update: Partial<Pick<StickerPlacement, "x" | "y" | "width">>) => void;
  onRemoveSticker: (id: string) => void;
  onPlaceLayoutPhoto: (slot: number, source: number) => void;
  onReorderLayoutPhotos: (from: number, to: number) => void;
  onNewSession: () => void;
}
const TABS = ["Layout & photos", "Style", "Stickers"] as const;

export function PhotoEditor({ session, onBackToReview, onLayoutChange, onPresetChange, onTemplateChange, onAddSticker, onUpdateSticker, onRemoveSticker, onPlaceLayoutPhoto, onReorderLayoutPhotos, onNewSession }: PhotoEditorProps) {
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const selection = session.layoutPhotoSelections[layout.id];
  const preview = useCompositionPreview(session);
  const [tab, setTab] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const activeSlot = Math.min(selectedSlot, layout.capacity - 1);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [downloadedBlob, setDownloadedBlob] = useState<Blob | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<{ mode: "move" | "resize"; startX: number; startY: number; sticker: StickerPlacement } | null>(null);
  const selectedSticker = session.stickers.find((item) => item.id === selectedStickerId);

  function download() {
    if (!preview.blob) return;
    try {
      downloadPng(preview.blob, getCompositionFilename(session));
      setDownloadedBlob(preview.blob); setDownloadError(null);
    } catch { setDownloadError("We couldn’t start your download. Please try Download PNG again."); }
  }
  function drop(event: DragEvent, slot: number) {
    event.preventDefault(); setDropTarget(null);
    const from = event.dataTransfer.getData("application/x-upsnap-layout-slot");
    const source = event.dataTransfer.getData("application/x-upsnap-source-photo");
    if (from !== "" && Number.isInteger(Number(from))) onReorderLayoutPhotos(Number(from), slot);
    else if (source !== "" && Number.isInteger(Number(source))) onPlaceLayoutPhoto(slot, Number(source));
    setSelectedSlot(slot);
  }
  function beginSticker(event: PointerEvent<HTMLElement>, sticker: StickerPlacement, mode: "move" | "resize") {
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedStickerId(sticker.id);
    interaction.current = { mode, startX: event.clientX, startY: event.clientY, sticker };
  }
  function moveSticker(event: PointerEvent<HTMLElement>) {
    const current = interaction.current;
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!current || !bounds) return;
    const { sticker, mode, startX, startY } = current;
    onUpdateSticker(sticker.id, mode === "move"
      ? { x: sticker.x + (event.clientX - startX) / bounds.width, y: sticker.y + (event.clientY - startY) / bounds.height }
      : { width: sticker.width + (event.clientX - startX) / bounds.width });
  }
  function stickerKeys(event: KeyboardEvent, sticker: StickerPlacement) {
    const nudge = event.shiftKey ? .05 : .02;
    if (event.key === "ArrowLeft") onUpdateSticker(sticker.id, { x: sticker.x - nudge });
    else if (event.key === "ArrowRight") onUpdateSticker(sticker.id, { x: sticker.x + nudge });
    else if (event.key === "ArrowUp") onUpdateSticker(sticker.id, { y: sticker.y - nudge });
    else if (event.key === "ArrowDown") onUpdateSticker(sticker.id, { y: sticker.y + nudge });
    else if (event.key === "Delete" || event.key === "Backspace") onRemoveSticker(sticker.id);
    else return;
    event.preventDefault();
  }
  return <section className="photo-editor" aria-labelledby="editor-heading">
    <div className="screen-heading"><div><p className="eyebrow">The finishing touches</p><h1 id="editor-heading">Make it yours<span className="accent">.</span></h1></div><details className="more-actions"><summary>More</summary><button onClick={() => setConfirmNew(true)}>New session</button></details></div>
    <div className="editor-workspace">
      <section className="composition-stage" aria-label="Composition preview">
        <div className="preview-caption"><span>OUR LITTLE TIME CAPSULE</span><span>{layout.capacity} PHOTOS</span></div>
        <div ref={canvasRef} className="composition-canvas" style={{ aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}`, width: `min(100%, ${Math.min(540, 540 * layout.canvasWidth / layout.canvasHeight)}px)` }}>
          {preview.url && <img src={preview.url} alt={`Final ${layout.label} composition`} />}
          {!preview.url && <div className="preview-placeholder" role="status">{preview.error ? "Your preview needs another try." : "Developing your photos…"}</div>}
          {tab === 0 && layout.slots.map((slot) => <button key={slot.index} className={`photo-slot ${activeSlot === slot.index ? "is-selected" : ""} ${dropTarget === slot.index ? "is-drop-target" : ""}`} style={{ left: `${slot.x / layout.canvasWidth * 100}%`, top: `${slot.y / layout.canvasHeight * 100}%`, width: `${slot.width / layout.canvasWidth * 100}%`, height: `${slot.height / layout.canvasHeight * 100}%` }} aria-label={`Position ${slot.index + 1}, photo ${selection[slot.index] + 1}`} aria-pressed={activeSlot === slot.index} onClick={() => setSelectedSlot(slot.index)} draggable onDragStart={(event) => { event.dataTransfer.setData("application/x-upsnap-layout-slot", String(slot.index)); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDropTarget(null)} onDragOver={(event) => { event.preventDefault(); setDropTarget(slot.index); }} onDragLeave={() => setDropTarget(null)} onDrop={(event) => drop(event, slot.index)}><span>{slot.index + 1}</span></button>)}
          {tab === 2 && session.stickers.map((sticker) => {
            const definition = getStickerDefinition(sticker.stickerId);
            return <div key={sticker.id} className={`sticker-overlay ${selectedStickerId === sticker.id ? "is-selected" : ""}`} style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%`, width: `${sticker.width * 100}%`, aspectRatio: String(definition.aspectRatio) }} role="button" tabIndex={0} aria-label={`${definition.label} sticker. Arrow keys to move, Delete to remove.`} onFocus={() => setSelectedStickerId(sticker.id)} onKeyDown={(event) => stickerKeys(event, sticker)} onPointerDown={(event) => beginSticker(event, sticker, "move")} onPointerMove={moveSticker} onPointerUp={() => { interaction.current = null; }} onPointerCancel={() => { interaction.current = null; }}><span className="sticker-handle" aria-hidden="true" onPointerDown={(event) => beginSticker(event, sticker, "resize")} /></div>;
          })}
        </div>
        <p className="preview-note" role="status">{preview.isRendering ? "Putting our print together…" : preview.error ? "Our preview hasn’t updated yet." : "Made together. Kept forever."}</p>
        {preview.error && <div className="error-message" role="alert">{preview.error} <button onClick={preview.retry}>Retry preview</button></div>}
      </section>
      <aside className="editor-tools" aria-label="Editing tools">
        <div className="tool-tabs" role="tablist" aria-label="Customize">{TABS.map((label, index) => <button key={label} id={`tool-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`tool-panel-${index}`} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={(event) => {
          const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
          if (next !== null) { event.preventDefault(); setTab(next); document.getElementById(`tool-tab-${next}`)?.focus(); }
        }}>{label}</button>)}</div>
        <div className="tool-panel" role="tabpanel" id={`tool-panel-${tab}`} aria-labelledby={`tool-tab-${tab}`}>
          {tab === 0 && <><h2>Pick your format</h2><div className="layout-options">{LAYOUT_DEFINITIONS.map((item) => <label className="layout-choice" key={item.id}><input type="radio" name="layout" checked={item.id === layout.id} onChange={() => onLayoutChange(item.id)} /><span className="layout-mini" style={{ gridTemplateColumns: `repeat(${item.columns}, 1fr)` }}>{item.slots.map((slot) => <i key={slot.index} />)}</span><strong>{item.label}</strong><small>{item.capacity} photos</small></label>)}</div>
            <h2>Our favorite moments</h2><p className="tool-hint">Choose a position on the print, then a photo below. Drag positions to reorder.</p><p className="selection-note" role="status">Choosing photo for position {activeSlot + 1}</p>
            <div className="photo-tray">{session.photos.map((photo, index) => photo && <button key={index} className="tray-photo" aria-label={`Use photo ${index + 1} in position ${activeSlot + 1}`} aria-pressed={selection[activeSlot] === index} onClick={() => onPlaceLayoutPhoto(activeSlot, index)} draggable onDragStart={(event) => { event.dataTransfer.setData("application/x-upsnap-source-photo", String(index)); event.dataTransfer.effectAllowed = "move"; }}><img src={photo.dataUrl} alt={`Photo ${index + 1}`} draggable={false} /><span>{index + 1}</span></button>)}</div></>}
          {tab === 1 && <><h2>Frame the feeling</h2><div className="frame-options">{TEMPLATE_DEFINITIONS.map((item) => <label key={item.id} className="frame-choice"><input type="radio" name="frame" checked={session.selectedTemplateId === item.id} onChange={() => onTemplateChange(item.id)} /><span className={`frame-swatch frame-${item.id}`} style={{ backgroundColor: item.backgroundColor }} /><span>{item.label}</span></label>)}</div><label className="field-label">Film preset<select value={session.selectedPresetId} onChange={(event) => onPresetChange(event.target.value as PresetId)}>{PRESET_DEFINITIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><p className="tool-hint">A little nostalgia goes a long way.</p></>}
          {tab === 2 && <><h2>A little extra personality</h2><p className="tool-hint">Add a sticker, then drag it on your print. Use arrow keys to nudge.</p><div className="sticker-catalog">{STICKER_DEFINITIONS.map((item) => <button key={item.id} aria-label={`Add ${item.label}`} onClick={() => onAddSticker(item.id)} disabled={session.stickers.length >= MAX_STICKERS}><img src={item.src} alt="" /><span>{item.label}</span></button>)}</div><p className="tool-hint" role="status">{session.stickers.length} / {MAX_STICKERS} stickers{session.stickers.length >= MAX_STICKERS ? " — remove one to add another." : ""}</p>{selectedSticker && <div className="sticker-controls"><label className="field-label">Sticker size<input type="range" min="0.06" max="0.6" step="0.01" value={selectedSticker.width} onChange={(event) => onUpdateSticker(selectedSticker.id, { width: Number(event.target.value) })} /></label><button onClick={() => onRemoveSticker(selectedSticker.id)}>Remove sticker</button></div>}</>}
        </div>
      </aside>
    </div>
    <footer className="editor-footer"><button className="text-button" onClick={onBackToReview}>← Back to review</button><div className="download-area">{downloadError && <p className="error-message" role="alert">{downloadError}</p>}{preview.blob && downloadedBlob === preview.blob && <span role="status">Download started. <button className="text-button" onClick={() => setConfirmNew(true)}>New session</button></span>}<button className="primary" onClick={download} disabled={!preview.blob}>{preview.isRendering ? "Developing…" : "Download PNG ↓"}</button></div></footer>
    {confirmNew && <ConfirmDialog title="Start a new session?" confirmLabel="New session" onCancel={() => setConfirmNew(false)} onConfirm={onNewSession}>This clears your current photos and edits. Download your print first if you want to keep it.</ConfirmDialog>}
  </section>;
}
