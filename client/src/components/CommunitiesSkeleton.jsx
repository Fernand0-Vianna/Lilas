export default function CommunitiesSkeleton() {
  return (
    <div className="container" style={{ maxWidth: 760, paddingTop: 24 }} aria-busy="true" aria-label="Carregando comunidades" role="status">
      <div className="skel-skeleton skel-rect" style={{ width: 180, height: 22, marginBottom: 16 }} />
      <div className="skel-skeleton skel-rect" style={{ width: '100%', height: 42, borderRadius: 10, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skel-comm-card">
            <div className="skel-skeleton skel-rect" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skel-skeleton skel-rect" style={{ width: 120 + (i % 3) * 30, height: 14, marginBottom: 6 }} />
              <div className="skel-skeleton skel-rect" style={{ width: 90, height: 10, marginBottom: 6 }} />
              <div className="skel-skeleton skel-rect" style={{ width: '80%', height: 11 }} />
            </div>
            <div className="skel-skeleton skel-rect" style={{ width: 70, height: 32, borderRadius: 999, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
