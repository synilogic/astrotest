import React, { useEffect, useState, useCallback } from 'react'
import { fetchUserKundaliRequests, getKundaliChart } from '../utils/api'

const UserKundaliList = ({ forId = '', kundaliType = 'kundli', kundaliMethod = '', pageSize = 10 }) => {
  const [kundalis, setKundalis] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [chart, setChart] = useState(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetchUserKundaliRequests({
        for_id: forId || undefined,
        kundali_type: kundaliType,
        kundali_method: kundaliMethod || '',
        offset: (p - 1) * pageSize
      })
      if (res.status === 1 && Array.isArray(res.data)) {
        setKundalis(res.data)
      } else {
        setKundalis([])
      }
    } catch (err) {
      console.error('[UserKundaliList] load error:', err)
      setKundalis([])
    } finally {
      setLoading(false)
    }
  }, [forId, kundaliType, kundaliMethod, pageSize])

  useEffect(() => { load(page) }, [load, page])

  const openView = async (kundli) => {
    setSelected(kundli)
    setViewOpen(true)
    setChart(null)
    try {
      const resp = await getKundaliChart(kundli.id)
      if (resp.status === 1 && resp.data) {
        setChart(resp.data.chart_image || resp.data)
      } else {
        setChart(null)
      }
    } catch (err) {
      console.error('[UserKundaliList] getKundaliChart error:', err)
      setChart(null)
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 12, color: '#333' }}>My Saved Kundalis</h3>
      {loading ? (
        <p style={{ color: '#666' }}>Loading saved kundalis...</p>
      ) : kundalis.length === 0 ? (
        <p style={{ color: '#666' }}>No saved kundalis found.</p>
      ) : (
        <div className="react-table-responsive">
          <table className="react-table" style={{ width: '100%', marginTop: 10 }}>
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Name</th>
                <th>Birth Date</th>
                <th>Birth Time</th>
                <th>Place</th>
                <th>Method</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {kundalis.map((kundli, idx) => {
                let requestBody = {}
                try { requestBody = kundli.request_body ? JSON.parse(kundli.request_body) : {} } catch (e) { requestBody = {} }
                return (
                  <tr key={kundli.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{kundli.name || requestBody.name || 'N/A'}</td>
                    <td>{requestBody.dob || 'N/A'}</td>
                    <td>{requestBody.tob || 'N/A'}</td>
                    <td>{requestBody.place || 'N/A'}</td>
                    <td>{kundli.kundali_method || 'd1'}</td>
                    <td>{kundli.created_at ? new Date(kundli.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button className="react-btn react-btn-sm react-btn-outline" onClick={() => openView(kundli)}>
                        <i className="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple modal */}
      {viewOpen && selected && (
        <div className="react-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="react-modal" style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Kundali Details</h3>
              <button className="react-btn react-btn-sm" onClick={() => { setViewOpen(false); setSelected(null); setChart(null) }}>Close</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <p><strong>Kundali ID:</strong> {selected.id}</p>
              <p><strong>Name:</strong> {selected.name || 'N/A'}</p>
              <p><strong>Method:</strong> {selected.kundali_method || 'd1'}</p>
              <div style={{ marginTop: 12 }}>
                {chart ? (
                  chart.startsWith && chart.startsWith('data:image') ? (
                    <img src={chart} alt="Kundali Chart" style={{ maxWidth: '100%' }} />
                  ) : typeof chart === 'string' && chart.startsWith('<svg') ? (
                    <div dangerouslySetInnerHTML={{ __html: chart }} />
                  ) : (
                    <img src={`data:image/svg+xml;base64,${chart}`} alt="Kundali Chart" style={{ maxWidth: '100%' }} />
                  )
                ) : (
                  <p style={{ color: '#666' }}>Chart not available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserKundaliList
