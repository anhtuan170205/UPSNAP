import type { PhotoSession } from "../../types/photoSession";
import "./EditorPlaceholder.css";

interface EditorPlaceholderProps { session: PhotoSession; onBackToReview: () => void; }

export function EditorPlaceholder({ session, onBackToReview }: EditorPlaceholderProps) {
  return <section className="editor-placeholder" aria-labelledby="editor-heading">
    <p className="stage-label">Next step</p>
    <h2 id="editor-heading">Your photos are ready to edit</h2>
    <p>{session.photos.filter(Boolean).length} photos are saved for the upcoming layout and styling tools.</p>
    <button type="button" onClick={onBackToReview}>Back to review</button>
  </section>;
}
