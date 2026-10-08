import { useState, type DragEvent } from "react";
import { LAYOUT_DEFINITIONS, getLayoutDefinition, type LayoutId } from "./layoutDefinitions";
import type { PhotoSession } from "../../types/photoSession";
import "./EditorPlaceholder.css";

interface EditorPlaceholderProps {
  session: PhotoSession;
  onBackToReview: () => void;
  onLayoutChange: (layoutId: LayoutId) => void;
  onPlaceLayoutPhoto: (layoutSlotIndex: number, sourceSlotIndex: number) => void;
  onReorderLayoutPhotos: (fromLayoutSlotIndex: number, toLayoutSlotIndex: number) => void;
}

export function EditorPlaceholder({ session, onBackToReview, onLayoutChange, onPlaceLayoutPhoto, onReorderLayoutPhotos }: EditorPlaceholderProps) {
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const selection = session.layoutPhotoSelections[layout.id];
  const [draggedLayoutSlotIndex, setDraggedLayoutSlotIndex] = useState<number | null>(null);
  const [draggedSourceSlotIndex, setDraggedSourceSlotIndex] = useState<number | null>(null);
  const [dropTargetLayoutSlotIndex, setDropTargetLayoutSlotIndex] = useState<number | null>(null);

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

  return <section className="editor-placeholder" aria-labelledby="editor-heading">
    <p className="stage-label">Compose your photos</p>
    <h2 id="editor-heading">Choose a layout</h2>
    <p>All {session.requiredPhotoCount} photos are saved. This {layout.capacity}-photo layout uses the selections below.</p>

    <div className="layout-selector" role="radiogroup" aria-label="Photo layout">
      {LAYOUT_DEFINITIONS.map((definition) => <button key={definition.id} type="button" role="radio" aria-checked={definition.id === layout.id} className={definition.id === layout.id ? "layout-option layout-option--selected" : "layout-option"} onClick={() => onLayoutChange(definition.id)}>{definition.label}<span>{definition.capacity} photos</span></button>)}
    </div>

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
    <button type="button" onClick={onBackToReview}>Back to review</button>
  </section>;
}
