export default function CommunitySkeleton() {
  return (
    <div className="container" aria-busy="true" aria-label="Carregando comunidade" role="status">
      <div style={{ paddingTop: 16 }}>
        {/* Banner skeleton */}
        <div className="comm-banner-wrap">
          <div className="comm-banner skel-cover" />
          <div className="comm-banner-info">
            <div className="skel-skeleton skel-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skel-skeleton skel-rect" style={{ width: 160, height: 20, marginBottom: 6 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 120, height: 12 }} />
            </div>
            <div className="skel-skeleton skel-rect" style={{ width: 80, height: 36, borderRadius: 999 }} />
          </div>
        </div>

        {/* Content grid */}
        <div className="comm-layout-grid">
          {/* Posts */}
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="skel-post-card" style={{ marginBottom: 12 }}>
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
                  <div className="skel-skeleton skel-rect" style={{ width: '85%', height: 16, marginBottom: 8 }} />
                  <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 12, marginBottom: 4 }} />
                  <div className="skel-skeleton skel-rect" style={{ width: '70%', height: 12, marginBottom: 12 }} />
                  <div className="skel-post-actions">
                    <div className="skel-skeleton skel-rect" style={{ width: 60, height: 20 }} />
                    <div className="skel-skeleton skel-rect" style={{ width: 60, height: 20 }} />
                    <div className="skel-skeleton skel-rect" style={{ width: 60, height: 20 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="comm-sidebar">
            <div className="skel-side-card">
              <div className="skel-skeleton skel-rect" style={{ width: 60, height: 14, marginBottom: 12 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 12, marginBottom: 6 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '80%', height: 12, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="skel-skeleton skel-rect" style={{ width: 36, height: 16 }} />
                  <div className="skel-skeleton skel-rect" style={{ width: 50, height: 10 }} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
