// Esqueleto completo do layout 3 colunas — impede CLS ao alternar entre
// estado de carregamento e conteúdo real no Feed.
export default function FeedSkeleton() {
  return (
    <div className="layout" aria-busy="true" aria-label="Carregando feed" role="status">
      {/* Rail skeleton */}
      <aside className="rail">
        <div className="skel-skeleton skel-rect" style={{ width: 100, height: 10, marginBottom: 12 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skel-rail-item">
            <div className="skel-skeleton skel-circle" style={{ width: 28, height: 28 }} />
            <div className="skel-skeleton skel-rect" style={{ width: `${60 + (i % 3) * 10}%`, height: 12 }} />
          </div>
        ))}
      </aside>

      {/* Main skeleton */}
      <main className="main">
        <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 36, marginBottom: 4 }} />
        <div className="feed-tabs">
          <button className="active" tabIndex={-1} aria-hidden="true">Em alta</button>
          <button tabIndex={-1} aria-hidden="true">Novo</button>
          <button tabIndex={-1} aria-hidden="true">Mais votado</button>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skel-post-card">
            <div className="skel-post-vote">
              <div className="skel-skeleton skel-rect" style={{ width: 24, height: 24 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 20, height: 12 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 24, height: 24 }} />
            </div>
            <div className="skel-post-content">
              <div className="skel-post-head">
                <div className="skel-skeleton skel-circle" style={{ width: 24, height: 24 }} />
                <div className="skel-skeleton skel-rect" style={{ width: 80, height: 12 }} />
                <div className="skel-skeleton skel-rect" style={{ width: 60, height: 10 }} />
              </div>
              <div className="skel-skeleton skel-rect" style={{ width: '90%', height: 16, marginBottom: 8 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 12, marginBottom: 4 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '75%', height: 12, marginBottom: 12 }} />
              <div className="skel-post-actions">
                <div className="skel-skeleton skel-rect" style={{ width: 60, height: 20 }} />
                <div className="skel-skeleton skel-rect" style={{ width: 60, height: 20 }} />
                <div className="skel-skeleton skel-rect" style={{ width: 60, height: 20 }} />
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Sidebar skeleton */}
      <aside className="side">
        <div className="skel-side-card" style={{ textAlign: 'center' }}>
          <div className="skel-skeleton skel-circle" style={{ width: 48, height: 48, margin: '0 auto 8px' }} />
          <div className="skel-skeleton skel-rect" style={{ width: 140, height: 14, margin: '0 auto 4px' }} />
          <div className="skel-skeleton skel-rect" style={{ width: 180, height: 10, margin: '0 auto 10px' }} />
          <div className="skel-skeleton skel-btn" style={{ margin: '0 auto', width: '100%' }} />
        </div>
        <div className="skel-side-card">
          <div className="skel-skeleton skel-rect" style={{ width: 60, height: 10, marginBottom: 8 }} />
          <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 10, marginBottom: 4 }} />
          <div className="skel-skeleton skel-rect" style={{ width: '80%', height: 10, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel-skeleton skel-rect" style={{ width: 70, height: 10 }} />
            <div className="skel-skeleton skel-rect" style={{ width: 90, height: 10 }} />
          </div>
        </div>
        <div className="skel-side-card">
          <div className="skel-skeleton skel-rect" style={{ width: 80, height: 10, marginBottom: 8 }} />
          <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 10 }} />
        </div>
      </aside>
    </div>
  )
}
