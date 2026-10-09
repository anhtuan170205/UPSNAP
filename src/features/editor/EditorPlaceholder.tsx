import { useEffect, useState, type DragEvent } from "react";
import { LAYOUT_DEFINITIONS, getLayoutDefinition, type LayoutId } from "./layoutDefinitions";
import { BACKGROUND_DEFINITIONS, FILTER_DEFINITIONS, FRAME_DEFINITIONS, type BackgroundId, type FilterId, type FrameId } from "./styleDefinitions";
import type { PhotoSession } from "../../types/photoSession";
import { renderComposition } from "../export/compositionService";
import "./EditorPlaceholder.css";

interface EditorPlaceholderProps {
  session: PhotoSession;
  onBackToReview: () => void;
  onLayoutChange: (layoutId: LayoutId) => void;
  onFilterChange: (filterId: FilterId) => void;
  onBackgroundChange: (backgroundId: BackgroundId) => void;
  onFrameChange: (frameId: FrameId) => void;
  onPlaceLayoutPhoto: (layoutSlotIndex: number, sourceSlotIndex: number) => void;
  onReorderLayoutPhotos: (fromLayoutSlotIndex: number, toLayoutSlotIndex: number) => void;
  onPreviewFinal: () => void;
}

export function EditorPlaceholder({ session, onBackToReview, onLayoutChange, onFilterChange, onBackgroundChange, onFrameChange, onPlaceLayoutPhoto, onReorderLayoutPhotos, onPreviewFinal }: EditorPlaceholderProps) {
  const layout = getLayoutDefinition(session.selectedLayoutId);
  const selection = session.layoutPhotoSelections[layout.id];
  const [draggedLayoutSlotIndex, setDraggedLayoutSlotIndex] = useState<number | null>(null);
  const [draggedSourceSlotIndex, setDraggedSourceSlotIndex] = useState<number | null>(null);
  const [dropTargetLayoutSlotIndex, setDropTargetLayoutSlotIndex] = useState<number | null>(null);
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

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

  return <section className="editor-placeholder" aria-labelledby="editor-heading">
    <p className="stage-label">Compose your photos</p>
    <h2 id="editor-heading">Choose a layout</h2>
    <p>All {session.requiredPhotoCount} photos are saved. This {layout.capacity}-photo layout uses the selections below.</p>

    <div className="layout-selector" role="radiogroup" aria-label="Photo layout">
      {LAYOUT_DEFINITIONS.map((definition) => <button key={definition.id} type="button" role="radio" aria-checked={definition.id === layout.id} className={definition.id === layout.id ? "layout-option layout-option--selected" : "layout-option"} onClick={() => onLayoutChange(definition.id)}>{definition.label}<span>{definition.capacity} photos</span></button>)}
    </div>

    <div className="style-selectors">
      <label>Filter
        <select value={session.selectedFilterId} onChange={(event) => onFilterChange(event.target.value as FilterId)}>
          {FILTER_DEFINITIONS.map((filter) => <option key={filter.id} value={filter.id}>{filter.label}</option>)}
        </select>
      </label>
      <label>Background
        <select value={session.selectedBackgroundId} onChange={(event) => onBackgroundChange(event.target.value as BackgroundId)}>
          {BACKGROUND_DEFINITIONS.map((background) => <option key={background.id} value={background.id}>{background.label}</option>)}
        </select>
      </label>
      <label>Frame
        <select value={session.selectedFrameId} onChange={(event) => onFrameChange(event.target.value as FrameId)}>
          {FRAME_DEFINITIONS.map((frame) => <option key={frame.id} value={frame.id}>{frame.label}</option>)}
        </select>
      </label>
    </div>

    <section className="rendered-composition" aria-labelledby="rendered-composition-heading">
      <h3 id="rendered-composition-heading">Styled composition</h3>
      <p>This is the same rendering used for your final PNG.</p>
      {previewError && <p className="rendered-composition__error" role="alert">{previewError}</p>}
      {renderedPreviewUrl ? <img src={renderedPreviewUrl} alt={`Styled ${layout.label} composition`} /> : !previewError && <p role="status">Updating composition preview...</p>}
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
