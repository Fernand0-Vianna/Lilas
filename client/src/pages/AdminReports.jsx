import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

export default function AdminReports() {
  const { session, profile } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmRemove, setConfirmRemove] = useState(null)

  useEffect(() => {
    if (!profile?.is_admin) return
    supabase.from('reports')
      .select('*, post:posts!reports_post_id_fkey(id, title, author_id), comment:comments!reports_comment_id_fkey(id, body, author_id)')
      .eq('status', 'aberto')
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const list = data || []
        const ids = [...new Set(list.map(r => r.reporter_id))]
        const { data: profiles } = ids.length
          ? await supabase.from('profiles').select('id, apelido').in('id', ids)
          : { data: [] }
        const byId = Object.fromEntries((profiles || []).map(p => [p.id, p.apelido]))
        setReports(list.map(r => ({ ...r, reporterApelido: byId[r.reporter_id] })))
        setLoading(false)
      })
  }, [profile?.is_admin, session.user.id])

  async function resolve(id) {
    await supabase.from('reports').update({ status: 'resolvido' }).eq('id', id)
    setReports(rs => rs.filter(r => r.id !== id))
  }

  async function doRemove() {
    const { id, kind, targetId } = confirmRemove
    await supabase.from(kind).delete().eq('id', targetId)
    await supabase.from('reports').update({ status: 'resolvido' }).eq('id', id)
    setReports(rs => rs.filter(r => r.id !== id))
    setConfirmRemove(null)
  }

  if (!profile?.is_admin) return <div className="container" style={{ paddingTop: 24 }}>Acesso restrito a administradores.</div>
  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="create-head"><h2>Denúncias pendentes</h2></div>
        {reports.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--muted)' }}>Nenhuma denúncia em aberto.</p>
          </div>
        )}
        {reports.map(r => (
          <div key={r.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Denunciado por u/{r.reporterApelido}</span>
              {r.post && <Link to={`/post/${r.post.id}`} style={{ color: 'var(--primary)' }}>Post: {r.post.title}</Link>}
              {r.comment && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Comentário: {r.comment.body}</span>}
              {r.reason && <span style={{ fontSize: 13, color: 'var(--muted)' }}>· "{r.reason}"</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {r.post && <button className="btn btn-outline" onClick={() => setConfirmRemove({ id: r.id, kind: 'posts', targetId: r.post.id })}>Excluir post</button>}
              {r.comment && <button className="btn btn-outline" onClick={() => setConfirmRemove({ id: r.id, kind: 'comments', targetId: r.comment.id })}>Excluir comentário</button>}
              <button className="btn btn-primary" onClick={() => resolve(r.id)}>Marcar resolvida</button>
            </div>
          </div>
        ))}
      </div>
      {confirmRemove && (
        <ConfirmModal
          title="Excluir conteúdo?"
          message="Tem certeza que deseja excluir este conteúdo e resolver a denúncia?"
          confirmLabel="Excluir"
          danger
          onConfirm={doRemove}
          onClose={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}