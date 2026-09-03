export default function PostSkeleton() {
  return (
    <div className="container" style={{ maxWidth: 760, paddingTop: 24 }} aria-busy="true" aria-label="Carregando post" role="status">
      {/* PostCard skeleton */}
      <div className="skel-post-card">
        <div className="skel-post-vote">
          <div className="skel-skeleton skel-rect" style={{ width: 24, height: 24 }} />
          <div className="skel-skeleton skel-rect" style={{ width: 20, height: 12 }} />
          <div className="skel-skeleton skel-rect" style={{ width: 24, height: 24 }} />
        </div>
        <div className="skel-post-content">
          <div className="skel-post-head">
            <div className="skel-skeleton skel-circle" style={{ width: 24, height: 24 }} />
            <div className="skel-skeleton skel-rect" style={{ width: 100, height: 12 }} />
            <div className="skel-skeleton skel-rect" style={{ width: 70, height: 10 }} />
          </div>
          <div className="skel-skeleton skel-rect" style={{ width: '85%', height: 18, marginBottom: 10 }} />
          <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 12, marginBottom: 4 }} />
          <div className="skel-skeleton skel-rect" style={{ width: '90%', height: 12, marginBottom: 4 }} />
          <div className="skel-skeleton skel-rect" style={{ width: '60%', height: 12, marginBottom: 12 }} />
          <div className="skel-post-actions">
            <div className="skel-skeleton skel-rect" style={{ width: 70, height: 20 }} />
            <div className="skel-skeleton skel-rect" style={{ width: 70, height: 20 }} />
            <div className="skel-skeleton skel-rect" style={{ width: 70, height: 20 }} />
          </div>
        </div>
      </div>

      {/* Comments skeleton */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="skel-skeleton skel-rect" style={{ width: 100, height: 16, marginBottom: 14 }} />

        {/* Comment input skeleton */}
        <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 64, borderRadius: 10, marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div className="skel-skeleton skel-rect" style={{ width: 100, height: 32, borderRadius: 999 }} />
        </div>

        {/* Comment rows */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skel-comment-row">
            <div className="skel-skeleton skel-circle" style={{ width: 28, height: 28, flexShrink: 0, marginTop: 2 }} />
            <div className="skel-comment-body">
              <div className="skel-skeleton skel-rect" style={{ width: 80, height: 10 }} />
              <div className="skel-skeleton skel-rect" style={{ width: `${90 - i * 10}%`, height: 12 }} />
              <div className="skel-skeleton skel-rect" style={{ width: `${60 - i * 5}%`, height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
