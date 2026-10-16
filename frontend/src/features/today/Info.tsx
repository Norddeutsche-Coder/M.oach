export default function Info({ topic, onOpen }: { topic: string; onOpen: (key: string) => void }) {
  return <span className="inf" role="button" tabIndex={0} aria-label="Info"
    onClick={event => { event.stopPropagation(); onOpen(topic) }}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); event.stopPropagation(); onOpen(topic)
      }
    }}>i</span>
}
