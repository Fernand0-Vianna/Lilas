export default function ProfileSkeleton() {
  return (
    <div className="profile-page" aria-busy="true" aria-label="Carregando perfil" role="status">
      {/* Topbar skeleton */}
      <div className="profile-topbar">
        <div className="profile-topbar-inner">
          <div className="skel-skeleton skel-circle" style={{ width: 32, height: 32 }} />
          <div className="skel-skeleton skel-rect" style={{ width: 120, height: 20 }} />
          <div style={{ flex: 1 }} />
          <div className="skel-skeleton skel-circle" style={{ width: 32, height: 32 }} />
        </div>
      </div>

      {/* Cover skeleton */}
      <div className="profile-hero">
        <div className="profile-cover skel-cover" />

        {/* Identity skeleton */}
        <div className="container profile-identity-wrap">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <div className="skel-skeleton skel-avatar" />
            </div>
            <div className="profile-info">
              <div className="skel-skeleton skel-rect" style={{ width: 160, height: 24, marginBottom: 8 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 100, height: 14, marginBottom: 12 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 220, height: 12, marginBottom: 6 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 140, height: 12 }} />
            </div>
            <div className="profile-actions">
              <div className="skel-skeleton skel-btn" />
              <div className="skel-skeleton skel-btn-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="container profile-body">
        {/* Stats skeleton */}
        <div className="profile-stats">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div className="skel-skeleton skel-rect" style={{ width: 36, height: 16 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 50, height: 10 }} />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="profile-tabs">
          <div className="skel-skeleton skel-rect" style={{ flex: 1, height: 36 }} />
          <div className="skel-skeleton skel-rect" style={{ flex: 1, height: 36 }} />
          <div className="skel-skeleton skel-rect" style={{ flex: 1, height: 36 }} />
        </div>

        {/* Grid skeleton */}
        <div className="profile-grid">
          <div className="profile-posts">
            {[1, 2].map(i => (
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
          </div>
          <aside className="profile-side">
            <div className="skel-side-card">
              <div className="skel-skeleton skel-rect" style={{ width: 80, height: 14, marginBottom: 12 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 12, marginBottom: 6 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '80%', height: 12, marginBottom: 12 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 120, height: 10 }} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}