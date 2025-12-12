import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'

const My_Account = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: 'Sami',
    phone: '7240779233',
    email: 'S@gmail.con',
    gender: 'Male',
    birthDate: '01-10-2025',
    birthTime: '01:29 PM',
    placeOfBirth: 'Kota, Rajasthan, India'
  })
  const [walletBalance, setWalletBalance] = useState(1500)
  const [rechargeAmount, setRechargeAmount] = useState('')

  // Pagination state per table
  const [walletPage, setWalletPage] = useState(1)
  const [walletPageSize, setWalletPageSize] = useState(10)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersFromDate, setOrdersFromDate] = useState('')
  const [ordersToDate, setOrdersToDate] = useState('')
  const [serviceOrdersPage, setServiceOrdersPage] = useState(1)
  const [serviceOrdersPageSize, setServiceOrdersPageSize] = useState(10)
  const [kundlisPage, setKundlisPage] = useState(1)
  const [kundlisPageSize, setKundlisPageSize] = useState(10)
  const [chatPage, setChatPage] = useState(1)
  const [chatPageSize, setChatPageSize] = useState(10)
  const [waitingPage, setWaitingPage] = useState(1)
  const [waitingPageSize, setWaitingPageSize] = useState(10)
  const [callPage, setCallPage] = useState(1)
  const [callPageSize, setCallPageSize] = useState(10)
  const [callSearch, setCallSearch] = useState('')
  const [supportPage, setSupportPage] = useState(1)
  const [supportPageSize, setSupportPageSize] = useState(10)

  const getPaginatedItems = (items, page, size) => {
    const start = (page - 1) * size
    return items.slice(start, start + size)
  }

  // Demo data arrays (replace with real API data when available)
  const walletTransactions = [
    { sn: 1, referenceId: 'order_RQ7Hsc6RbwDo0J', paymentId: '-', date: '06/10/2025', amount: '₹59.00', type: 'cr', narration: 'Wallet Add Amount by Customer Recharge # ₹ 50.00', status: 'Pending' },
    { sn: 2, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 3, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 4, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 5, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 6, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 7, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 8, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 9, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 10, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 11, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 12, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 13, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 14, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 15, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 16, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 17, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 18, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 19, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 20, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 21, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 22, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 23, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 24, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 25, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 26, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 27, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 28, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 29, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },
    { sn: 30, referenceId: '-', paymentId: '-', date: '06/10/2025', amount: '₹1500.00', type: 'cr', narration: 'Wallet Amount Add by admin for Test # ₹ 1500', status: 'Complete' },

  ]
  const orders = []
  const serviceOrders = []
  const kundlis = []
  const chats = [
    { sn: 1, astrologer: 'ASTRO0056', uniqueId: 'CHAT0052', orderDate: 'Mon, 06 Oct, 2025', start: '-', end: '-', duration: '0', status: 'Declined(Customer)', type: 'Chat' }
  ]
  const waitingList = []
  const calls = []
  const tickets = []

  // Addresses state
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Sami', phone: '+91 7240779233', email: 's@gmail.con', houseNo: 'C-7', street: 'Santosh Nagar - I', landmark: 'Near Park', pincode: '324009', city: 'Kota', state: 'Rajasthan', country: 'India', address: 'C-7, Santosh Nagar - I, Borkhera' },
  ])
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)

  const openAddAddress = () => {
    setEditingAddress(null)
    setAddressModalOpen(true)
  }

  const openEditAddress = (addr) => {
    setEditingAddress(addr)
    setAddressModalOpen(true)
  }

  const deleteAddress = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSaveAddress = (e) => {
    e.preventDefault()
    const form = e.target
    const formData = Object.fromEntries(new FormData(form).entries())
    if (editingAddress) {
      setAddresses((prev) => prev.map((a) => (a.id === editingAddress.id ? { ...editingAddress, ...formData } : a)))
    } else {
      const newAddr = { id: Date.now(), ...formData }
      setAddresses((prev) => [newAddr, ...prev])
    }
    setAddressModalOpen(false)
  }

  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: 'fa-user' },
    { id: 'wallet', label: 'My Wallet', icon: 'fa-wallet' },
    { id: 'addresses', label: 'My Addresses', icon: 'fa-map-marker-alt' },
    { id: 'orders', label: 'My Orders', icon: 'fa-shopping-bag' },
    { id: 'service-orders', label: 'My Service Orders', icon: 'fa-concierge-bell' },
    { id: 'kundlis', label: 'My Kundli List', icon: 'fa-star' },
    { id: 'chat-history', label: 'My Chat History', icon: 'fa-comments' },
    { id: 'waiting-list', label: 'My Waiting List', icon: 'fa-clock' },
    { id: 'call-history', label: 'My Call History', icon: 'fa-phone' },
    { id: 'horoscope', label: 'My Daily Horoscope', icon: 'fa-sun' },
    { id: 'support', label: 'My Support Ticket', icon: 'fa-ticket-alt' }
  ]

  const rechargeOptions = [50, 100, 200, 500, 1000, 2000, 5000]

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    // Handle profile update logic here
    console.log('Profile updated:', profileData)
  }

  const handleRecharge = (amount) => {
    setRechargeAmount(amount)
    // Handle recharge logic here
    console.log('Recharge amount:', amount)
  }

  const renderProfileSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Edit Profile</h2>
        <p>Update your personal information</p>
      </div>
      
      <div className="react-profile-picture-section">
        <div className="react-profile-picture">
          <img src="https://via.placeholder.com/120x120/ee5a24/ffffff?text=S" alt="Profile" />
          <div className="react-profile-overlay">
            <i className="fas fa-camera"></i>
          </div>
        </div>
        <button className="react-btn react-btn-outline react-choose-file-btn">
          <i className="fas fa-upload"></i>
          Choose File
        </button>
      </div>

      <form onSubmit={handleProfileUpdate} className="react-profile-form">
        <div className="react-form-row">
          <div className="react-form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="react-form-input"
            />
          </div>
          <div className="react-form-group">
            <label htmlFor="phone">Phone No.</label>
            <div className="react-phone-input-group">
              <select className="react-country-code">
                <option value="+91">+91</option>
                <option value="+1">+1</option>
              </select>
              <input
                type="tel"
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="react-form-input" style={{width: '100%'}}
              />
            </div>
          </div>
        </div>

        <div className="react-form-row">
          <div className="react-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              className="react-form-input"
            />
          </div>
          <div className="react-form-group">
            <label>Gender</label>
            <div className="react-radio-group">
              <label className="react-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={profileData.gender === 'Male'}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                />
                <span className="react-radio-custom"></span>
                Male
              </label>
              <label className="react-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={profileData.gender === 'Female'}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                />
                <span className="react-radio-custom"></span>
                Female
              </label>
              <label className="react-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Other"
                  checked={profileData.gender === 'Other'}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                />
                <span className="react-radio-custom"></span>
                Other
              </label>
            </div>
          </div>
        </div>

        <div className="react-form-row">
          <div className="react-form-group">
            <label htmlFor="birthDate">Birth Date</label>
            <div className="react-date-input-group">
              <input
                type="date"
                id="birthDate"
                value={profileData.birthDate}
                onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                className="react-form-input" style={{width: '100%'}}
              />
              {/* <i className="fas fa-calendar-alt"></i> */}
            </div>
          </div>
          <div className="react-form-group">
            <label htmlFor="birthTime">Birth Time</label>
            <div className="react-time-input-group">
              <input
                type="time"
                id="birthTime"
                value={profileData.birthTime}
                onChange={(e) => setProfileData({...profileData, birthTime: e.target.value})}
                className="react-form-input"
              />
              {/* <i className="fas fa-clock"></i> */}
            </div>
          </div>
        </div>

        <div className="react-form-group">
          <label htmlFor="placeOfBirth">Place Of Birth *</label>
          <input
            type="text"
            id="placeOfBirth"
            value={profileData.placeOfBirth}
            onChange={(e) => setProfileData({...profileData, placeOfBirth: e.target.value})}
            className="react-form-input"
            required
          />
        </div>

        <button type="submit" className="react-btn react-btn-primary react-update-profile-btn">
          <i className="fas fa-save"></i>
          Update Profile
        </button>
      </form>
    </div>
  )

  const renderWalletSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Wallet</h2>
        <p>Manage your wallet balance and transactions</p>
      </div>

      <div className="react-wallet-balance-card">
        <div className="react-balance-info">
          <h3>Available Funds</h3>
          <div className="react-balance-amount">₹{walletBalance}</div>
        </div>
        <div className="react-balance-icon">
          <i className="fas fa-wallet"></i>
        </div>
      </div>

      <div className="react-recharge-section">
        <h3>Recharge With</h3>
        <div className="react-recharge-options">
          {rechargeOptions.map((amount) => (
            <button
              key={amount}
              className={`react-recharge-option ${rechargeAmount === amount ? 'active' : ''}`}
              onClick={() => handleRecharge(amount)}
            >
              ₹{amount}
            </button>
          ))}
        </div>
        <div className="react-custom-amount">
          <input
            type="number"
            placeholder="Enter custom amount"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            className="react-form-input"
          />
          <button className="react-btn react-btn-primary">Recharge</button>
        </div>
      </div>

      <div className="transaction-history">
        <div className="react-section-subheader">
          <h3>Transaction History</h3>
          <div className="react-filter-options">
            <select className="react-filter-select">
              <option>All Transactions</option>
              <option>Credits</option>
              <option>Debits</option>
            </select>
          </div>
        </div>
        
        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Reference Id</th>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Narration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedItems(walletTransactions, walletPage, walletPageSize).map((row, idx) => (
                <tr key={`${row.referenceId}-${idx}`}>
                  <td>{(walletPage - 1) * walletPageSize + idx + 1}</td>
                  <td>{row.referenceId}</td>
                  <td>{row.paymentId}</td>
                  <td>{row.date}</td>
                  <td>{row.amount}</td>
                  <td><span className={`react-badge ${row.type === 'cr' ? 'credit' : 'pending'}`}>{row.type}</span></td>
                  <td>{row.narration}</td>
                  <td>
                    <span className={`react-badge ${row.status === 'Complete' ? 'completed' : row.status === 'Pending' ? 'pending' : ''}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {walletTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="react-no-data">No Records Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={walletPage}
          totalItems={walletTransactions.length}
          pageSize={walletPageSize}
          onPageChange={setWalletPage}
          onPageSizeChange={(s) => { setWalletPageSize(s); setWalletPage(1) }}
        />
      </div>
    </div>
  )

  const renderAddressSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap'}}>
          <div>
            <h2>Saved Address</h2>
            <p>Manage your delivery addresses</p>
          </div>
          <button className="react-btn react-btn-primary" onClick={openAddAddress}>
            <i className="fas fa-plus" style={{marginRight:'6px'}}></i>
            Add New Address
          </button>
        </div>
      </div>
      {/* Address Cards */}
      <div className="react-address-grid">
        {addresses.map((addr) => (
          <div className="react-address-card" key={addr.id}>
            <div className="react-address-card-header">
              <h4>{addr.name}</h4>
              <div className="react-address-actions">
                <button className="react-btn react-btn-outline react-small" onClick={() => openEditAddress(addr)}><i className="fas fa-edit"></i> Edit</button>
                <button className="react-btn react-btn-outline react-small" onClick={() => deleteAddress(addr.id)}><i className="fas fa-trash"></i> Delete</button>
              </div>
            </div>
            <div className="react-address-lines">
              <p>{addr.address}</p>
              <p>{addr.street}</p>
              <p>{addr.city}, {addr.state} - {addr.pincode}</p>
              <p>{addr.country}</p>
            </div>
            <div className="react-address-meta">
              <span><i className="fas fa-phone"></i> {addr.phone}</span>
              <span><i className="fas fa-envelope"></i> {addr.email}</span>
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
          <div className="react-no-data" style={{width:'100%'}}>No Saved Addresses</div>
        )}
      </div>

      {/* Add/Edit Address Modal */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <form className="react-address-form" onSubmit={handleSaveAddress}>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Name</label>
              <input name="name" defaultValue={editingAddress?.name || ''} className="react-form-input" required />
            </div>
            <div className="react-form-group">
              <label>Email</label>
              <input type="email" name="email" defaultValue={editingAddress?.email || ''} className="react-form-input" />
            </div>
          </div>
          <div className="react-form-group">
            <label>Phone</label>
            <input name="phone" defaultValue={editingAddress?.phone || ''} className="react-form-input" required />
          </div>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>House No</label>
              <input name="houseNo" defaultValue={editingAddress?.houseNo || ''} className="react-form-input" />
            </div>
            <div className="react-form-group">
              <label>Street Area</label>
              <input name="street" defaultValue={editingAddress?.street || ''} className="react-form-input" />
            </div>
          </div>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>City</label>
              <input name="city" defaultValue={editingAddress?.city || ''} className="react-form-input" />
            </div>
            <div className="react-form-group">
              <label>State</label>
              <input name="state" defaultValue={editingAddress?.state || ''} className="react-form-input" />
            </div>
          </div>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Pincode</label>
              <input name="pincode" defaultValue={editingAddress?.pincode || ''} className="react-form-input" />
            </div>
            <div className="react-form-group">
              <label>Country</label>
              <input name="country" defaultValue={editingAddress?.country || 'India'} className="react-form-input" />
            </div>
          </div>
          <div className="react-form-group">
            <label>Address</label>
            <textarea name="address" defaultValue={editingAddress?.address || ''} className="react-form-textarea" rows="3"></textarea>
          </div>
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end', flexWrap:'wrap'}}>
            <button type="button" className="react-btn react-btn-outline" onClick={() => setAddressModalOpen(false)}>Cancel</button>
            <button type="submit" className="react-btn react-btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )

  const renderOrdersSection = () => {
    const query = ordersSearch.trim().toLowerCase()
    const filteredByQuery = query
      ? orders.filter((o) =>
          String(o.orderId || '').toLowerCase().includes(query) ||
          String(o.productName || '').toLowerCase().includes(query)
        )
      : orders

    // Date range filter (expects row.date in a parseable format like YYYY-MM-DD or DD/MM/YYYY)
    const parseDate = (value) => {
      if (!value) return null
      // Try ISO first
      const iso = new Date(value)
      if (!isNaN(iso.getTime())) return iso
      // Try DD/MM/YYYY
      const parts = String(value).split('/')
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
        if (!isNaN(d.getTime())) return d
      }
      return null
    }

    const fromDate = parseDate(ordersFromDate)
    const toDate = parseDate(ordersToDate)

    const filtered = filteredByQuery.filter((row) => {
      if (!fromDate && !toDate) return true
      const rowDate = parseDate(row.date)
      if (!rowDate) return false
      if (fromDate && rowDate < fromDate) return false
      if (toDate) {
        // include entire end day
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (rowDate > end) return false
      }
      return true
    })
    const data = getPaginatedItems(filtered, ordersPage, ordersPageSize)
    return (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Orders</h2>
        <p>Track your order history</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options" style={{width:'100%', gap:'0.75rem', justifyContent:'space-between', flexWrap:'wrap'}}>
          <div style={{display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap'}}>
            <input
              type="text"
              value={ordersSearch}
              onChange={(e)=>{ setOrdersSearch(e.target.value); setOrdersPage(1) }}
              className="react-form-input"
              placeholder="Search by Order Id or Product Name"
              style={{maxWidth:'360px'}}
              aria-label="Search orders"
            />
            <div style={{display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap'}}>
              <label style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>From</label>
              <input
                type="date"
                value={ordersFromDate}
                onChange={(e)=>{ setOrdersFromDate(e.target.value); setOrdersPage(1) }}
                className="react-form-input"
                style={{minWidth:'160px'}}
                aria-label="From date"
              />
              <label style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>To</label>
              <input
                type="date"
                value={ordersToDate}
                onChange={(e)=>{ setOrdersToDate(e.target.value); setOrdersPage(1) }}
                className="react-form-input"
                style={{minWidth:'160px'}}
                aria-label="To date"
              />
            </div>
          </div>
          <select className="react-filter-select">
            <option>All Orders</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Image</th>
              <th>Order Id</th>
              <th>Product</th>
              <th>Ordered Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>{(ordersPage - 1) * ordersPageSize + idx + 1}</td>
                <td>-</td>
                <td>{row.orderId}</td>
                <td>{row.productName || '-'}</td>
                <td>{row.date}</td>
                <td>{row.amount}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={ordersPage}
        totalItems={filtered.length}
        pageSize={ordersPageSize}
        onPageChange={setOrdersPage}
        onPageSizeChange={(s) => { setOrdersPageSize(s); setOrdersPage(1) }}
      />
    </div>
  )}

  const renderServiceOrdersSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Service Orders</h2>
        <p>Track your service orders</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options">
          <select className="react-filter-select">
            <option>All Service Orders</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Order ID</th>
              <th>Reference ID</th>
              <th>Total Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(serviceOrders, serviceOrdersPage, serviceOrdersPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(serviceOrdersPage - 1) * serviceOrdersPageSize + idx + 1}</td>
                <td>{row.orderId}</td>
                <td>{row.referenceId}</td>
                <td>{row.amount}</td>
                <td>{row.date}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {serviceOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={serviceOrdersPage}
        totalItems={serviceOrders.length}
        pageSize={serviceOrdersPageSize}
        onPageChange={setServiceOrdersPage}
        onPageSizeChange={(s) => { setServiceOrdersPageSize(s); setServiceOrdersPage(1) }}
      />
    </div>
  )

  const renderKundlisSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Kundlis</h2>
        <p>Manage your Kundli records</p>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Kundali ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(kundlis, kundlisPage, kundlisPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(kundlisPage - 1) * kundlisPageSize + idx + 1}</td>
                <td>{row.kundaliId}</td>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.phone}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {kundlis.length === 0 && (
              <tr>
                <td colSpan="7" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={kundlisPage}
        totalItems={kundlis.length}
        pageSize={kundlisPageSize}
        onPageChange={setKundlisPage}
        onPageSizeChange={(s) => { setKundlisPageSize(s); setKundlisPage(1) }}
      />
    </div>
  )

  const renderChatHistorySection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Chat History</h2>
        <p>View your chat sessions with astrologers</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options">
          <select className="react-filter-select">
            <option>All Chats</option>
            <option>Completed</option>
            <option>Declined</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Astrologer</th>
              <th>Unique ID</th>
              <th>Order Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Call Type</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(chats, chatPage, chatPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(chatPage - 1) * chatPageSize + idx + 1}</td>
                <td>{row.astrologer}</td>
                <td>{row.uniqueId}</td>
                <td>{row.orderDate}</td>
                <td>{row.start}</td>
                <td>{row.end}</td>
                <td>{row.duration}</td>
                <td><span className="react-badge react-declined">{row.status}</span></td>
                <td>{row.type}</td>
              </tr>
            ))}
            {chats.length === 0 && (
              <tr>
                <td colSpan="9" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={chatPage}
        totalItems={chats.length}
        pageSize={chatPageSize}
        onPageChange={setChatPage}
        onPageSizeChange={(s) => { setChatPageSize(s); setChatPage(1) }}
      />
    </div>
  )

  const renderWaitingListSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Waiting Time History</h2>
        <p>Track your waiting list history</p>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>Astrologer Name</th>
              <th>Unique ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(waitingList, waitingPage, waitingPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{row.name}</td>
                <td>{row.uniqueId}</td>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {waitingList.length === 0 && (
              <tr>
                <td colSpan="6" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={waitingPage}
        totalItems={waitingList.length}
        pageSize={waitingPageSize}
        onPageChange={setWaitingPage}
        onPageSizeChange={(s) => { setWaitingPageSize(s); setWaitingPage(1) }}
      />
    </div>
  )

  const renderCallHistorySection = () => {
    const query = callSearch.trim().toLowerCase()
    const filtered = query
      ? calls.filter((c) =>
          String(c.astrologer || '').toLowerCase().includes(query) ||
          String(c.uniqueId || '').toLowerCase().includes(query)
        )
      : calls
    const data = getPaginatedItems(filtered, callPage, callPageSize)
    return (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Call History</h2>
        <p>View your call sessions with astrologers</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options" style={{width:'100%', gap:'0.75rem', justifyContent:'space-between', flexWrap:'wrap'}}>
          <input
            type="text"
            value={callSearch}
            onChange={(e)=>{ setCallSearch(e.target.value); setCallPage(1) }}
            className="react-form-input"
            placeholder="Search by Astrologer Id or Unique Id"
            style={{maxWidth:'360px'}}
            aria-label="Search calls"
          />
          <select className="react-filter-select">
            <option>All Calls</option>
            <option>Completed</option>
            <option>Missed</option>
            <option>Declined</option>
          </select>
        </div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Astrologer</th>
              <th>Unique ID</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>{(callPage - 1) * callPageSize + idx + 1}</td>
                <td>{row.astrologer}</td>
                <td>{row.uniqueId}</td>
                <td>{row.date}</td>
                <td>{row.start}</td>
                <td>{row.end}</td>
                <td>{row.duration}</td>
                <td>{row.status}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={callPage}
        totalItems={filtered.length}
        pageSize={callPageSize}
        onPageChange={setCallPage}
        onPageSizeChange={(s) => { setCallPageSize(s); setCallPage(1) }}
      />
    </div>
  )}

  const renderSupportSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Support Ticket</h2>
        <p>Manage your support tickets</p>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Ticket No</th>
              <th>User ID</th>
              <th>Department</th>
              <th>Subject</th>
              <th>Description</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(tickets, supportPage, supportPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(supportPage - 1) * supportPageSize + idx + 1}</td>
                <td>{row.ticketNo}</td>
                <td>{row.userId}</td>
                <td>{row.department}</td>
                <td>{row.subject}</td>
                <td>{row.description}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan="8" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={supportPage}
        totalItems={tickets.length}
        pageSize={supportPageSize}
        onPageChange={setSupportPage}
        onPageSizeChange={(s) => { setSupportPageSize(s); setSupportPage(1) }}
      />
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSection()
      case 'wallet': return renderWalletSection()
      case 'addresses': return renderAddressSection()
      case 'orders': return renderOrdersSection()
      case 'service-orders': return renderServiceOrdersSection()
      case 'kundlis': return renderKundlisSection()
      case 'chat-history': return renderChatHistorySection()
      case 'waiting-list': return renderWaitingListSection()
      case 'call-history': return renderCallHistorySection()
      case 'support': return renderSupportSection()
      default: return renderProfileSection()
    }
  }

  return (
    <>
      <Navbar />
      
      <div className="react-my-account-page">
        <div className="container">
          {/* User Profile Header */}
          <div className="react-user-profile-header">
            <div className="react-profile-avatar">
              <img src="https://www.karmleela.com/uploads/setting/62096.png" alt="User" />
            </div>
            <div className="react-profile-info">
              <h2>Sami</h2>
              <p>S@gmail.con</p>
              <p>+917240779233</p>
              <p className="react-customer-id">CUS0193</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="react-tab-navigation">
            <div className="react-tab-container">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`react-tab-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span className="react-tab-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="react-account-content fadeInUp" key={activeTab}>
            {renderContent()}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default My_Account