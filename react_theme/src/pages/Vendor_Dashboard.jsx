import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'

const Vendor_Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  // Demo state (replace with API later)
  const [walletBalance] = useState(0)
  const [products] = useState([])
  const [orders] = useState([])
  const [walletTxns] = useState([])
  const [withdrawals] = useState([])

  // Pagination demo
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [walletPage, setWalletPage] = useState(1)
  const [walletPageSize, setWalletPageSize] = useState(10)
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(10)
  const [withdrawPage, setWithdrawPage] = useState(1)
  const [withdrawPageSize, setWithdrawPageSize] = useState(10)
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)

  const getPaginatedItems = (items, page, size) => {
    const start = (page - 1) * size
    return items.slice(start, start + size)
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'orders', label: 'My Orders', icon: 'fa-shopping-bag' },
    { id: 'wallet', label: 'My Wallet', icon: 'fa-wallet' },
    { id: 'products', label: 'My Product', icon: 'fa-box' },
    { id: 'add-product', label: 'Add Product', icon: 'fa-plus' },
    { id: 'withdrawals', label: 'Withdrawal Request', icon: 'fa-money-check-alt' },
  ]

  const OverviewCards = () => (
    <div className="react-grid-cards">
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Income</h4>
          <div className="react-stat-value">0</div>
        </div>
        <i className="fas fa-rupee-sign react-stat-icon"></i>
      </div>
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Balance</h4>
          <div className="react-stat-value">0</div>
        </div>
        <i className="fas fa-wallet react-stat-icon"></i>
      </div>
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Product</h4>
          <div className="react-stat-value">0</div>
        </div>
        <i className="fas fa-boxes react-stat-icon"></i>
      </div>
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Order</h4>
          <div className="react-stat-value">0</div>
        </div>
        <i className="fas fa-shopping-cart react-stat-icon"></i>
      </div>
    </div>
  )

  const TripleLine = ({ title }) => (
    <div className="react-triple-line">
      <div className="react-triple-line-header">{title}</div>
      <div className="react-triple-line-body">
        <div className="react-triple-item">
          <div className="react-triple-label">Total</div>
          <div className="react-triple-value">0</div>
        </div>
        <div className="react-triple-item">
          <div className="react-triple-label">Yesterday</div>
          <div className="react-triple-value">0</div>
        </div>
        <div className="react-triple-item">
          <div className="react-triple-label">Today</div>
          <div className="react-triple-value">0</div>
        </div>
      </div>
    </div>
  )

  const OverviewSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Vendor Dashboard</h2>
        <p>Overview of your store performance</p>
      </div>

      <OverviewCards />

      <div className="react-grid-rows-3">
        <TripleLine title="Pending Order" />
        <TripleLine title="Dispatch Order" />
        <TripleLine title="Confirm Order" />
        <TripleLine title="Delivered Order" />
        <TripleLine title="Cancel Order" />
      </div>

      <div className="react-two-col">
        <div className="react-card">
          <div className="react-section-subheader">
            <h3>Income Overview</h3>
            <span className="react-muted">Last 12 Month Data</span>
          </div>
          <div className="react-no-data" style={{height:'220px'}}>Chart Coming Soon</div>
        </div>
        <div className="react-card">
          <div className="react-section-subheader">
            <h3>New Orders</h3>
          </div>
          <div className="react-table-container">
            <table className="react-data-table">
              <thead>
                <tr>
                  <th>S. No</th>
                  <th>Order Id</th>
                  <th>User Id</th>
                  <th>Total Amount</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="react-no-data">No Records Found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const WalletSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Wallet</h2>
        <p>Available Balance</p>
      </div>
      <div className="react-wallet-balance-card">
        <div className="react-balance-info">
          <h3>Available Balance</h3>
          <div className="react-balance-amount">₹{walletBalance}</div>
        </div>
        <div className="react-balance-icon"><i className="fas fa-wallet"></i></div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Order Id</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Credit/Debit</th>
              <th>Narration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(walletTxns, walletPage, walletPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(walletPage - 1) * walletPageSize + idx + 1}</td>
                <td>{row.orderId}</td>
                <td>{row.date}</td>
                <td>{row.amount}</td>
                <td>{row.type}</td>
                <td>{row.narration}</td>
                <td>{row.status}</td>
              </tr>
            ))}
            {walletTxns.length === 0 && (
              <tr><td colSpan="7" className="react-no-data">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={walletPage}
        totalItems={walletTxns.length}
        pageSize={walletPageSize}
        onPageChange={setWalletPage}
        onPageSizeChange={(s)=>{ setWalletPageSize(s); setWalletPage(1) }}
      />
    </div>
  )

  const ProductsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Product</h2>
        <p>Available Product</p>
      </div>
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>MRP</th>
              <th>Price / Unit</th>
              <th>GST%</th>
              <th>Images</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(products, productPage, productPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(productPage - 1) * productPageSize + idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.mrp}</td>
                <td>{row.price}</td>
                <td>{row.gst}</td>
                <td>-</td>
                <td>-</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="8" className="react-no-data">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={productPage}
        totalItems={products.length}
        pageSize={productPageSize}
        onPageChange={setProductPage}
        onPageSizeChange={(s)=>{ setProductPageSize(s); setProductPage(1) }}
      />
    </div>
  )

  const AddProductSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Add Product</h2>
      </div>
      <form className="react-profile-form" onSubmit={(e)=> e.preventDefault()}>
        <div className="react-form-group">
          <label>Product Category</label>
          <select className="react-form-input">
            <option>Please Select Product Category</option>
          </select>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>Product Name</label>
            <input className="react-form-input" placeholder="Product name" />
          </div>
          <div className="react-form-group">
            <label>Price</label>
            <input className="react-form-input" placeholder="Price Inr" />
          </div>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>MRP</label>
            <input className="react-form-input" placeholder="MRP" />
          </div>
          <div className="react-form-group">
            <label>HSN</label>
            <input className="react-form-input" placeholder="Hsn" />
          </div>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>GST %</label>
            <input className="react-form-input" placeholder="Gst %" />
          </div>
          <div className="react-form-group">
            <label>Unit</label>
            <select className="react-form-input">
              <option>Please Select</option>
            </select>
          </div>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>Stock</label>
            <input className="react-form-input" placeholder="-/+" />
          </div>
          <div className="react-form-group">
            <label>Images</label>
            <input type="file" className="react-form-input" />
          </div>
        </div>
        <div className="react-form-group">
          <label>Description</label>
          <textarea className="react-form-textarea" rows="4" placeholder="Description"></textarea>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <button className="react-btn react-btn-primary" type="submit">Save Product</button>
          <button className="react-btn react-btn-outline" type="button">Reset</button>
        </div>
      </form>
    </div>
  )

  const OrdersSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Orders</h2>
        <p>Total Orders:- 0</p>
      </div>
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No</th>
              <th>Order Id</th>
              <th>User Id</th>
              <th>Total Amount</th>
              <th>Created Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(orders, ordersPage, ordersPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(ordersPage - 1) * ordersPageSize + idx + 1}</td>
                <td>{row.orderId}</td>
                <td>{row.userId}</td>
                <td>{row.amount}</td>
                <td>{row.date}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="7" className="react-no-data">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={ordersPage}
        totalItems={orders.length}
        pageSize={ordersPageSize}
        onPageChange={setOrdersPage}
        onPageSizeChange={(s)=>{ setOrdersPageSize(s); setOrdersPage(1) }}
      />
    </div>
  )

  const WithdrawalSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap'}}>
          <div>
            <h2>Withdrawal Request</h2>
            {/* <p>No Records Found</p> */}
          </div>
          <button className="react-btn react-btn-primary" onClick={() => setWithdrawalModalOpen(true)}>
            <i className="fas fa-plus" style={{marginRight:'6px'}}></i>
            Add Withdrawal Request
          </button>
        </div>
      </div>
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>REQUEST AMOUNT</th>
              <th>REQUEST MESSAGE</th>
              <th>Image</th>
              <th>Remark</th>
              <th>status</th>
              <th>created at</th>
              <th>action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(withdrawals, withdrawPage, withdrawPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(withdrawPage - 1) * withdrawPageSize + idx + 1}</td>
                <td>{row.amount}</td>
                <td>{row.message}</td>
                <td>-</td>
                <td>{row.remark}</td>
                <td>{row.status}</td>
                <td>{row.createdAt}</td>
                <td>-</td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr><td colSpan="8" className="react-no-data">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={withdrawPage}
        totalItems={withdrawals.length}
        pageSize={withdrawPageSize}
        onPageChange={setWithdrawPage}
        onPageSizeChange={(s)=>{ setWithdrawPageSize(s); setWithdrawPage(1) }}
      />

      <Modal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        title="Add Withdrawal Request"
      >
        <form className="react-profile-form" onSubmit={(e)=> { e.preventDefault(); setWithdrawalModalOpen(false) }}>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Amount</label>
              <input className="react-form-input" placeholder="Request Amount" required />
            </div>
            <div className="react-form-group">
              <label>Message</label>
              <input className="react-form-input" placeholder="Request Message" />
            </div>
          </div>
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end'}}>
            <button className="react-btn react-btn-outline" type="button" onClick={() => setWithdrawalModalOpen(false)}>Cancel</button>
            <button className="react-btn react-btn-primary" type="submit">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewSection />
      case 'orders': return <OrdersSection />
      case 'wallet': return <WalletSection />
      case 'products': return <ProductsSection />
      case 'add-product': return <AddProductSection />
      case 'withdrawals': return <WithdrawalSection />
      default: return <OverviewSection />
    }
  }

  return (
    <>
      <Navbar />

      <div className="react-my-account-page">
        <div className="container">
          <div className="react-user-profile-header">
            <div className="react-profile-avatar">
              <img src="https://www.karmleela.com/uploads/setting/62096.png" alt="Vendor" />
            </div>
            <div className="react-profile-info">
              <h2>Vendor</h2>
              <p>vendor@example.com</p>
              <p>+91 0000000000</p>
              <p className="react-customer-id">VND0001</p>
            </div>
          </div>

          <div className="react-tab-navigation">
            <div className="react-tab-container">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`tab-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span className="react-tab-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="react-account-content fadeInUp" key={activeTab}>
            {renderContent()}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default Vendor_Dashboard