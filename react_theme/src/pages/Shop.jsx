import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchProducts, fetchProductCategories, purchaseProduct, getUserAddresses, getCurrentUser, getProductCalculation } from '../utils/api'

const Shop = () => {
  usePageTitle('Shop - Astrology Theme')
  
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(categoryId || '')
  const [priceFilter, setPriceFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [userAddresses, setUserAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressError, setAddressError] = useState('')
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [calculationData, setCalculationData] = useState(null)
  const [loadingCalculation, setLoadingCalculation] = useState(false)
  const [offerCode, setOfferCode] = useState('')
  const purchasingRef = useRef(false)
  const timeoutRef = useRef(null)
  const isHandledRef = useRef(false)
  
  // Safety monitor: Force reset purchasing state if it's been true for too long
  useEffect(() => {
    if (purchasing) {
      purchasingRef.current = true
      // Set a shorter timeout (20 seconds) to force reset if stuck
      const forceResetTimeout = setTimeout(() => {
        if (purchasingRef.current) {
          // Force reset all purchasing-related state
          setPurchasing(false)
          setPurchaseError('Purchase request timed out. Please try again.')
          purchasingRef.current = false
          isHandledRef.current = false
        }
      }, 20000) // 20 seconds max
      
      return () => {
        clearTimeout(forceResetTimeout)
      }
    } else {
      purchasingRef.current = false
    }
  }, [purchasing])

  // Fetch products and categories in parallel (instant loading)
  useEffect(() => {
    // Fetch products with category filter if provided
    const requestFilters = {
      offset: 0,
      limit: 50,
      search: searchTerm || ''
    }
    
    // Only add category_id if it's not empty and convert to number
    if (selectedCategory && selectedCategory !== '') {
      const categoryIdNum = parseInt(selectedCategory, 10)
      if (!isNaN(categoryIdNum)) {
        requestFilters.category_id = categoryIdNum
      }
    }
    
    // Fetch products and categories in parallel
    Promise.allSettled([
      fetchProducts(requestFilters).catch(() => ({ status: 0, data: [] })),
      fetchProductCategories({ offset: 0, limit: 20, status: 1 }).catch(() => ({ status: 0, data: [] }))
    ]).then(([productsResult, categoriesResult]) => {
      // Update products immediately
      if (productsResult.status === 'fulfilled' && productsResult.value?.status === 1 && Array.isArray(productsResult.value?.data)) {
        setProducts(productsResult.value.data)
      } else {
        setProducts([])
      }
      
      // Update categories immediately
      if (categoriesResult.status === 'fulfilled' && categoriesResult.value?.status === 1 && Array.isArray(categoriesResult.value?.data)) {
        setCategories(categoriesResult.value.data)
      } else {
        // Explicitly set empty array if categories fetch fails
        setCategories([])
      }
    })
  }, [searchTerm, selectedCategory])

  // Update selected category when URL param changes
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId)
    }
  }, [categoryId])

  // Filter products by price
  const filterProductsByPrice = (productList) => {
    if (priceFilter === 'all') return productList
    
    return productList.filter(product => {
      const price = parseFloat(product.price) || 0
      switch (priceFilter) {
        case 'under-50':
          return price < 50
        case '50-100':
          return price >= 50 && price <= 100
        case '150-250':
          return price >= 150 && price <= 250
        default:
          return true
      }
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by useEffect when searchTerm changes
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId)
  }

  const handleReset = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setPriceFilter('all')
  }

  // Handle body overflow when modal opens/closes
  useEffect(() => {
    if (showProductModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showProductModal])

  // Reset purchasing state when modal is closed
  useEffect(() => {
    if (!showProductModal) {
      setPurchasing(false)
      purchasingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [showProductModal])
  
  // Safety: Force reset purchasing state after 30 seconds if still true
  useEffect(() => {
    if (purchasing) {
      purchasingRef.current = true
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Set new safety timeout
      timeoutRef.current = setTimeout(() => {
        if (purchasingRef.current) {
          purchasingRef.current = false
          setPurchasing(false)
          setPurchaseError('Request took too long. Please try again.')
        }
      }, 30000)
    } else {
      purchasingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [purchasing])

  // Debug: Log userAddresses changes
  useEffect(() => {
    // Addresses state tracking removed
  }, [userAddresses])

  // Debug: Log selectedAddressId changes
  useEffect(() => {
    // Address ID tracking removed
  }, [selectedAddressId, userAddresses])

  // Handle Buy Now button click - fetch product details from backend
  const handleBuyNow = async (product) => {
    // Immediately set the clicked product to ensure correct product is shown
    // This prevents showing wrong product if API call is slow or fails
    setSelectedProduct(product)
    
    setLoadingProduct(true)
    setPurchaseError('')
    setPurchaseSuccess(false)
    setPurchasing(false) // Reset purchasing state
    setQuantity(1)
    setSelectedAddressId('')
    setPaymentMethod('wallet')
    
    // Check if user is logged in
    const user = getCurrentUser()
    if (!user) {
      setPurchaseError('Please login to purchase products')
      setLoadingProduct(false)
      // You can redirect to login or show login popup here
      return
    }

    try {
      // Fetch fresh product details from backend using product ID
      const productId = product.id || product.product_id
      if (!productId) {
        setLoadingProduct(false)
        return
      }

      // Fetch user addresses (product is already set, no need to fetch it again)
      setLoadingAddresses(true)
      setAddressError('')
      try {
        console.log('[Shop] Fetching user addresses...')
        const addressResponse = await getUserAddresses()
        console.log('[Shop] Address response received:', {
          status: addressResponse?.status,
          hasData: !!addressResponse?.data,
          dataType: typeof addressResponse?.data,
          isArray: Array.isArray(addressResponse?.data),
          dataLength: addressResponse?.data ? (Array.isArray(addressResponse?.data) ? addressResponse?.data.length : 'not array') : 0,
          msg: addressResponse?.msg
        })
        
        if (addressResponse && addressResponse.status === 1 && addressResponse.data) {
          // Ensure data is an array
          let addressArray = []
          
          if (Array.isArray(addressResponse.data)) {
            addressArray = addressResponse.data
            console.log('[Shop] Address data is array, length:', addressArray.length)
          } else if (addressResponse.data && typeof addressResponse.data === 'object') {
            // If data is a single object, convert to array
            console.log('[Shop] Address data is single object, converting to array')
            addressArray = [addressResponse.data]
          } else {
            console.warn('[Shop] Address data is unexpected type:', typeof addressResponse.data)
          }
          
          // Filter out any addresses without valid IDs
          addressArray = addressArray.filter(addr => {
            const addrId = addr.id || addr.address_id || addr.ID || addr.ADDRESS_ID
            const isValid = addrId !== undefined && addrId !== null && String(addrId).trim() !== ''
            if (!isValid) {
              console.warn('[Shop] Filtering out address without valid ID:', addr)
            }
            return isValid
          })
          
          console.log('[Shop] Valid addresses after filtering:', addressArray.length)
          
          if (addressArray.length > 0) {
            setUserAddresses(addressArray)
            console.log('[Shop] Set userAddresses to', addressArray.length, 'addresses')
            
            // Auto-select first address if no address is currently selected
            // This happens when modal first opens (selectedAddressId was reset to '')
            if (!selectedAddressId || selectedAddressId === '') {
              const firstAddress = addressArray[0]
              const addressId = firstAddress.id || firstAddress.address_id || firstAddress.ID || firstAddress.ADDRESS_ID
              if (addressId) {
                const firstAddressIdString = String(addressId)
                setSelectedAddressId(firstAddressIdString)
                console.log('[Shop] Auto-selected first address:', firstAddressIdString)
              }
            } else {
              // Verify the currently selected address still exists in the new list
              const currentAddressExists = addressArray.some(addr => {
                const addrId = String(addr.id || addr.address_id || addr.ID || addr.ADDRESS_ID || '')
                return addrId === String(selectedAddressId)
              })
              
              if (!currentAddressExists) {
                // Current selection doesn't exist, select first address
                const firstAddress = addressArray[0]
                const addressId = firstAddress.id || firstAddress.address_id || firstAddress.ID || firstAddress.ADDRESS_ID
                if (addressId) {
                  setSelectedAddressId(String(addressId))
                  console.log('[Shop] Selected first address (current selection invalid):', String(addressId))
                }
              }
            }
          } else {
            // No valid addresses found
            console.warn('[Shop] No valid addresses found after filtering')
            setUserAddresses([])
            setSelectedAddressId('')
          }
        } else {
          // API returned status 0 or no data
          const errorMsg = addressResponse?.msg || 'No addresses found'
          console.warn('[Shop] Address API returned status 0 or no data:', {
            status: addressResponse?.status,
            hasData: !!addressResponse?.data,
            msg: errorMsg
          })
          setUserAddresses([])
          setSelectedAddressId('')
          setAddressError(errorMsg)
        }
      } catch (addressError) {
        // Error fetching addresses - set empty array
        console.error('[Shop] Exception while fetching addresses:', addressError)
        setUserAddresses([])
        setSelectedAddressId('')
        setAddressError(addressError.message || 'Failed to load addresses. Please try again.')
      } finally {
        setLoadingAddresses(false)
      }

      setShowProductModal(true)
      
      // Fetch calculation data after modal opens
      if (product && user) {
        fetchCalculationData(product, 1, selectedAddressId || '')
      }
    } catch (error) {
      // Use existing product data as fallback
      setSelectedProduct(product)
      setShowProductModal(true)
    } finally {
      setLoadingProduct(false)
    }
  }

  // Fetch calculation data when quantity, address, or offer code changes
  const fetchCalculationData = async (product, qty, addressId) => {
    if (!product || !qty || qty < 1) {
      setCalculationData(null)
      return
    }

    const user = getCurrentUser()
    if (!user) {
      setCalculationData(null)
      return
    }

    // Don't fetch if address is not selected yet
    if (!addressId || addressId === '') {
      setCalculationData(null)
      return
    }

    setLoadingCalculation(true)
    try {
      const productId = product.id || product.product_id
      const vendorUniId = product.vendor_uni_id || product.vendor_id

      if (!productId || !vendorUniId) {
        setCalculationData(null)
        return
      }

      const calcResult = await getProductCalculation({
        product_id: productId,
        vendor_uni_id: vendorUniId,
        quantity: qty,
        offer_code: offerCode || '',
        wallet_check: 1,
        payment_method: paymentMethod === 'online' ? '' : ''
      })

      if (calcResult?.status === 1 && calcResult?.data) {
        setCalculationData(calcResult.data)
      } else {
        setCalculationData(null)
      }
    } catch (error) {
      setCalculationData(null)
    } finally {
      setLoadingCalculation(false)
    }
  }

  // Fetch calculation when quantity, address, or offer code changes
  useEffect(() => {
    if (selectedProduct && quantity > 0 && selectedAddressId) {
      const debounceTimer = setTimeout(() => {
        fetchCalculationData(selectedProduct, quantity, selectedAddressId)
      }, 500) // Debounce to avoid too many API calls

      return () => clearTimeout(debounceTimer)
    } else {
      setCalculationData(null)
    }
  }, [quantity, selectedAddressId, offerCode, paymentMethod, selectedProduct])

  // Handle product purchase
  const handlePurchase = async () => {
    // Prevent double-clicks and multiple simultaneous purchases
    if (purchasing) {
      return
    }

    if (!selectedProduct) {
      setPurchaseError('Product not selected')
      return
    }

    const user = getCurrentUser()
    if (!user) {
      setPurchaseError('Please login to purchase products')
      return
    }

    if (!selectedAddressId) {
      setPurchaseError('Please select a delivery address')
      return
    }

    if (quantity < 1) {
      setPurchaseError('Please enter a valid quantity')
      return
    }
    
    // Reset all states before starting
    setPurchasing(true)
    setPurchaseError('')
    setPurchaseSuccess(false)
    
    // Reset the handled flag at the start
    isHandledRef.current = false
    let safetyTimeout = null
    let purchaseTimeout = null
    
    // Safety timeout - force reset after 25 seconds no matter what
    // This is a backup in case the Promise.race timeout doesn't work
    safetyTimeout = setTimeout(() => {
      if (!isHandledRef.current) {
        isHandledRef.current = true
        // CRITICAL: Force reset purchasing state
        setPurchasing(false)
        setPurchaseError('Request took too long. Please try again.')
        // Clear purchase timeout if it exists
        if (purchaseTimeout) {
          clearTimeout(purchaseTimeout)
          purchaseTimeout = null
        }
      }
    }, 25000)

    try {
      const productId = selectedProduct.id || selectedProduct.product_id
      const vendorUniId = selectedProduct.vendor_uni_id || selectedProduct.vendor_id

      // Validate required fields before purchase
      if (!productId) {
        isHandledRef.current = true
        clearTimeout(safetyTimeout)
        setPurchaseError('Product ID is missing. Please try again.')
        setPurchasing(false)
        return
      }
      if (!vendorUniId) {
        isHandledRef.current = true
        clearTimeout(safetyTimeout)
        setPurchaseError('Vendor information is missing. Please try again.')
        setPurchasing(false)
        return
      }
      if (!selectedAddressId) {
        isHandledRef.current = true
        clearTimeout(safetyTimeout)
        setPurchaseError('Please select a delivery address')
        setPurchasing(false)
        return
      }

      // Get the current selectedAddressId value (use state directly, not closure)
      const currentAddressId = selectedAddressId
      
      // Verify selected address exists
      const selectedAddress = userAddresses.find(addr => {
        const addrId = String(addr.id || addr.address_id || '')
        return addrId === String(currentAddressId)
      })
      
      if (!selectedAddress) {
        isHandledRef.current = true
        if (safetyTimeout) {
          clearTimeout(safetyTimeout)
          safetyTimeout = null
        }
        setPurchaseError('Selected address not found. Please select an address again.')
        setPurchasing(false)
        return
      }
      
      // Use the verified address ID
      const addressIdToUse = String(selectedAddress.id || selectedAddress.address_id)

      // Map frontend payment methods to backend format
      // Backend logic:
      // - If payment_method is provided and is a gateway name (razorpay, CCAvenue, etc.), use that gateway
      // - If payment_method is empty or not provided, use default gateway from config
      // - For wallet/COD, backend checks payable_amount - if 0, payment is complete
      // - For online, backend uses default gateway
      // So we should send empty string for wallet/COD/online to let backend use default logic
      let backendPaymentMethod = ''
      
      if (paymentMethod === 'razorpay') {
        backendPaymentMethod = 'razorpay'
      } else if (paymentMethod === 'CCAvenue') {
        backendPaymentMethod = 'CCAvenue'
      } else if (paymentMethod === 'PhonePe') {
        backendPaymentMethod = 'PhonePe'
      } else if (paymentMethod === 'Cashfree') {
        backendPaymentMethod = 'Cashfree'
      } else if (paymentMethod === 'Payu') {
        backendPaymentMethod = 'Payu'
      } else {
        // For wallet, COD, or online - send empty string
        // Backend will check wallet first, then use default gateway if needed
        backendPaymentMethod = ''
      }

      const purchaseData = {
        product_id: productId,
        vendor_uni_id: vendorUniId,
        address_id: addressIdToUse,
        quantity: quantity,
        payment_method: backendPaymentMethod,
        wallet_check: 1,
        offer_code: '',
        reference_id: ''
      }
      
      // Call purchase API with timeout wrapper
      let result = null
      let apiCallCompleted = false
      
      try {
        // Create a timeout promise that rejects after 18 seconds
        // This is shorter than API's 25 second timeout to fail faster when request is stuck in "pending"
        const timeoutPromise = new Promise((_, reject) => {
          purchaseTimeout = setTimeout(() => {
            if (!apiCallCompleted) {
              apiCallCompleted = true
              // CRITICAL: Reset purchasing state immediately on timeout
              setPurchasing(false)
              reject(new Error('Request is stuck in pending state. The backend server may not be responding. Please check if the backend is running at http://localhost:8007'))
            }
          }, 18000) // 18 seconds - fail before API's 25 second timeout
        })
        
        // Race between API call and timeout
        // Use Promise.race to ensure we don't wait forever
        // Wrap in try-catch to handle any unexpected errors
        const apiCallPromise = (async () => {
          try {
            const response = await purchaseProduct(purchaseData)
            apiCallCompleted = true
            if (purchaseTimeout) {
              clearTimeout(purchaseTimeout)
              purchaseTimeout = null
            }
            // Ensure response is always an object
            return response || { status: 0, msg: 'No response from server' }
          } catch (error) {
            apiCallCompleted = true
            if (purchaseTimeout) {
              clearTimeout(purchaseTimeout)
              purchaseTimeout = null
            }
            // Return error object instead of throwing
            return { status: 0, msg: error.message || 'API call failed. Please try again.' }
          }
        })()
        
        result = await Promise.race([
          apiCallPromise,
          timeoutPromise
        ])
        
        // Clear timeout if API call completed first (backup)
        if (purchaseTimeout) {
          clearTimeout(purchaseTimeout)
          purchaseTimeout = null
        }
        
      } catch (apiError) {
        apiCallCompleted = true
        // Clear timeout on error
        if (purchaseTimeout) {
          clearTimeout(purchaseTimeout)
          purchaseTimeout = null
        }
        // CRITICAL: Reset purchasing state immediately on timeout/error
        setPurchasing(false)
        // Convert error to result object instead of throwing
        result = { status: 0, msg: apiError.message || 'Request failed. Please try again.' }
      }

      // CRITICAL: Reset purchasing state IMMEDIATELY after getting response
      // Do this FIRST before any processing to prevent UI from getting stuck
      setPurchasing(false)
      
      // Mark as handled and clear safety timeout
      isHandledRef.current = true
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
        safetyTimeout = null
      }
      
      // Safety check: if result is null/undefined, treat as error
      if (!result || typeof result !== 'object') {
        setPurchaseError('No response from server. Please try again.')
        return
      }
      
      // If API returned an error status, handle it immediately
      if (result.status === 0 || result.status === '0') {
        const errorMsg = result.msg || result.message || 'Failed to place order. Please try again.'
        setPurchaseError(errorMsg)
        // Ensure purchasing state is reset (backup)
        setPurchasing(false)
        return
      }

      // Handle different response formats from backend
      // Backend returns:
      // 1. When payment complete: { status: "Order placed successfully" } or { status: 1 }
      // 2. When payment gateway needed: { status: 1, payment_gateway_status: 1, order_id, ... }
      const statusValue = result?.status
      const statusAsNumber = typeof statusValue === 'string' ? parseInt(statusValue, 10) : statusValue
      
      // Check for success - backend can return status as string "Order placed successfully" or number 1
      // Also check if order_id exists (indicates order was created)
      const hasOrderId = result?.order_id && String(result.order_id).trim() !== ''
      const isSuccess = 
        statusAsNumber === 1 || 
        statusValue === '1' ||
        statusValue === 1 ||
        statusValue === 'Order placed successfully' ||
        (typeof statusValue === 'string' && statusValue.toLowerCase().includes('success')) ||
        (typeof statusValue === 'string' && statusValue.includes('Order placed')) ||
        hasOrderId

      // Wrap success/error handling in try-catch to ensure state is always reset
      try {
        if (isSuccess) {
          setPurchaseSuccess(true)
          setPurchaseError('')
          
          // Get order ID from various possible locations
          const orderId = result?.order_id || result?.data?.order_id || 'N/A'
          
          // Store all purchase data from backend
          const purchaseResponseData = {
            order_id: orderId,
            payment_gateway_status: result?.payment_gateway_status || 0,
            payment_gateway: result?.payment_gateway || null,
            ccavenue_data: result?.ccavenue_data || null,
            phonepe_data: result?.phonepe_data || null,
            cashfree_data: result?.cashfree_data || null,
            payu_data: result?.payu_data || null,
            customerData: result?.customerData || null,
            calculation_data: result?.data || calculationData,
            msg: result?.msg || 'Order placed successfully'
          }
          
          // Check if payment gateway is needed
          // payment_gateway_status: 0 = paid, 1 = needs payment gateway
          if (result?.payment_gateway_status === 1) {
            // Handle payment gateway redirect based on gateway type
            let gatewayHandled = false
            
            // Handle Razorpay
            if (result?.payment_gateway && result.payment_gateway.order_id) {
              // Razorpay integration would go here
              alert(`Order placed successfully! Please complete the payment. Order ID: ${orderId}`)
              gatewayHandled = true
            }
            
            // Handle CCAvenue
            if (result?.ccavenue_data && result.ccavenue_data.enc_val) {
              // CCAvenue form submission would go here
              alert(`Order placed successfully! Please complete the payment. Order ID: ${orderId}`)
              gatewayHandled = true
            }
            
            // Handle PhonePe
            if (result?.phonepe_data && result.phonepe_data.data) {
              // PhonePe redirect would go here
              alert(`Order placed successfully! Please complete the payment. Order ID: ${orderId}`)
              gatewayHandled = true
            }
            
            // Handle Cashfree
            if (result?.cashfree_data && result.cashfree_data.payment_session_id) {
              // Cashfree redirect would go here
              alert(`Order placed successfully! Please complete the payment. Order ID: ${orderId}`)
              gatewayHandled = true
            }
            
            // Handle PayU
            if (result?.payu_data && result.payu_data.payment_url) {
              // PayU redirect would go here
              alert(`Order placed successfully! Please complete the payment. Order ID: ${orderId}`)
              gatewayHandled = true
            }
            
            if (!gatewayHandled) {
              alert(`Order placed successfully! Please complete the payment. Order ID: ${orderId}`)
            }
          } else {
            // Order placed and payment completed (wallet or COD)
            alert(`Order placed successfully! Order ID: ${orderId}`)
          }
          
          // Close modal after 2 seconds
          setTimeout(() => {
            setShowProductModal(false)
            setSelectedProduct(null)
            setPurchaseSuccess(false)
            setPurchasing(false)
            setSelectedAddressId('')
            setQuantity(1)
            setCalculationData(null)
            setOfferCode('')
          }, 2000)
        } else {
          const errorMsg = result?.msg || result?.message || result?.data?.msg || 'Failed to place order. Please try again.'
          setPurchaseError(errorMsg)
        }
      } catch (processingError) {
        // If there's an error processing the success response, still reset state
        setPurchasing(false)
        setPurchaseError('Error processing order response. Please check your orders.')
      }
    } catch (error) {
      // Mark as handled
      isHandledRef.current = true
      
      // Clear all timeouts
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
        safetyTimeout = null
      }
      if (purchaseTimeout) {
        clearTimeout(purchaseTimeout)
        purchaseTimeout = null
      }
      
      // CRITICAL: Always reset purchasing state on error - do this FIRST
      setPurchasing(false)
      
      // Handle different error types
      let errorMessage = 'An error occurred while placing the order. Please try again.'
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout. Please try again.'
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = 'Request timeout. Please try again.'
      } else if (error.message?.includes('network') || error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setPurchaseError(errorMessage)
    } finally {
      // SAFETY: Always ensure purchasing is reset and all timeouts are cleared
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
        safetyTimeout = null
      }
      if (purchaseTimeout) {
        clearTimeout(purchaseTimeout)
        purchaseTimeout = null
      }
      // CRITICAL: Force reset purchasing state as final safety measure
      // Use immediate reset to prevent stuck state
      if (!isHandledRef.current) {
        setPurchasing(false)
        setPurchaseError('An unexpected error occurred. Please try again.')
      }
      // Additional safety: Always reset after a short delay as backup
      // This ensures state is reset even if something goes wrong
      const backupReset = setTimeout(() => {
        setPurchasing(false)
        // Also reset the handled flag as backup
        isHandledRef.current = false
      }, 500)
      
      // Cleanup backup reset if component unmounts
      return () => {
        clearTimeout(backupReset)
      }
    }
  }

  const filteredProducts = filterProductsByPrice(products)

  useEffect(() => {
    const overlay = document.getElementById('cusTom-popupOverlay')
    const closeBtn = document.getElementById('cusTom-closeModal')
    const openBtns = Array.from(document.querySelectorAll('#cusTom-openModal'))

    if (!overlay || !closeBtn) return

    const openPopup = () => {
      overlay.style.display = 'flex'
      requestAnimationFrame(() => {
        overlay.classList.add('react-cusTom-show')
      })
    }

    const closePopup = () => {
      overlay.classList.remove('react-cusTom-show')
      setTimeout(() => {
        overlay.style.display = 'none'
      }, 200)
    }

    openBtns.forEach((btn) => btn.addEventListener('click', openPopup))
    closeBtn.addEventListener('click', closePopup)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup()
    })
    const onKey = (e) => {
      if (e.key === 'Escape') closePopup()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      openBtns.forEach((btn) => btn.removeEventListener('click', openPopup))
      closeBtn.removeEventListener('click', closePopup)
      overlay.removeEventListener('click', closePopup)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div>
      <Navbar />

      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="react-new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
            <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">Our Products</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="/">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Products</span>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="react-shop-container">
            <aside className="react-shop-sidebar">
              <div className="react-shop-search-section">
                <form onSubmit={handleSearch} className="react-shop-search-container">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="react-shop-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="react-shop-search-btn">
                    <i className="fas fa-search"></i>
                  </button>
                </form>
              </div>
              <div className="react-shop-filter-section" style={{borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                <h3 className="react-shop-filter-title"><i className="fa-solid fa-wallet react-shop-Icon"></i> Price</h3>
                <div className="react-shop-filter-options">
                  <label className="react-shop-filter-option">
                    <input 
                      type="radio" 
                      name="price" 
                      value="under-50"
                      checked={priceFilter === 'under-50'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    />
                    <span className="react-shop-checkmark"></span>
                    Under ₹50
                  </label>
                  <label className="react-shop-filter-option">
                    <input 
                      type="radio" 
                      name="price" 
                      value="50-100"
                      checked={priceFilter === '50-100'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    />
                    <span className="react-shop-checkmark"></span>
                    ₹50 to ₹100
                  </label>
                  <label className="react-shop-filter-option">
                    <input 
                      type="radio" 
                      name="price" 
                      value="150-250"
                      checked={priceFilter === '150-250'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    />
                    <span className="react-shop-checkmark"></span>
                    ₹150 to ₹250
                  </label>
                  <label className="react-shop-filter-option">
                    <input 
                      type="radio" 
                      name="price" 
                      value="all"
                      checked={priceFilter === 'all'}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    />
                    <span className="react-shop-checkmark"></span>
                    All
                  </label>
                </div>
              </div>
              <div className="react-shop-filter-section">
                <h3 className="react-shop-filter-title"><i className="fas fa-newspaper react-shop-Icon"></i> Categories</h3>
                <div className="react-shop-filter-options">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <label key={category.id} className="react-shop-filter-option">
                        <input 
                          type="checkbox" 
                          name="category" 
                          value={category.id}
                          checked={selectedCategory === String(category.id)}
                          onChange={() => handleCategoryChange(String(category.id))}
                        />
                        <span className="react-shop-checkbox"></span>
                        {category.title}
                      </label>
                    ))
                  ) : (
                    <p style={{padding: '10px', color: '#666'}}>No categories available</p>
                  )}
                </div>
              </div>
              <button className="react-shop-reset-btn" onClick={handleReset}>
                <i className="fas fa-undo"></i>
                RESET
              </button>
            </aside>

            <main className="react-shop-products-section">
              <h3 className="react-shop-filter-title" style={{fontSize: '26px'}}>
                <i className="fas fa-store react-shop-Icon" style={{marginRight: '10px'}}></i>
                Products {selectedCategory && `(${filteredProducts.length})`}
              </h3>
              {filteredProducts.length > 0 ? (
                <div className="react-shop-products-grid">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="react-shop-product-card">
                      <div className="react-shop-product-image">
                        <img 
                          src={product.product_image || 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} 
                          alt={product.product_name || 'Product'} 
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                          }}
                        />
                      </div>
                      <div className="react-shop-product-info">
                        <h4 className="react-shop-product-title">{product.product_name || 'Product'}</h4>
                        <div className="react-shop-product-price">₹{product.price || '0'}</div>
                        <button 
                          className="react-shop-buy-now-btn" 
                          onClick={() => handleBuyNow(product)}
                          disabled={loadingProduct}
                        >
                          {loadingProduct ? 'Loading...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <p style={{fontSize: '18px', color: '#666', marginBottom: '10px'}}>
                    {selectedCategory 
                      ? `No products found in this category. Try selecting a different category or clear the filter.`
                      : 'No products found. Try adjusting your search or filters.'}
                  </p>
                  {selectedCategory && (
                    <>
                      <p style={{fontSize: '14px', color: '#999', marginBottom: '15px'}}>
                        Category ID: {selectedCategory}
                      </p>
                      <button 
                        onClick={() => setSelectedCategory('')}
                        style={{
                          marginTop: '10px',
                          padding: '10px 20px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Category Filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Product Details Modal - Shows when Buy Now is clicked */}
      {showProductModal && (
        <div 
          className="react-cusTom-overlay react-cusTom-show" 
          style={{
            display: 'flex', 
            zIndex: 100000,
            overflow: 'auto',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProductModal(false)
              setSelectedProduct(null)
            }
          }}
        >
          <div 
            className="react-cusTom-popup" 
            style={{ 
              maxWidth: '600px', 
              width: '90%', 
              padding: '2rem',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              margin: 'auto'
            }}
          >
            <button 
              className="react-cusTom-closeBtn" 
              onClick={() => {
                setShowProductModal(false)
                setSelectedProduct(null)
                setPurchaseError('')
                setPurchaseSuccess(false)
              }}
              style={{ 
                position: 'sticky',
                top: '10px',
                right: '10px',
                background: 'rgba(255,255,255,0.95)', 
                border: '2px solid #ddd',
                borderRadius: '50%', 
                width: '40px', 
                height: '40px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '20px', 
                color: '#333',
                zIndex: 10,
                alignSelf: 'flex-end',
                marginBottom: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#ff6b6b'
                e.target.style.color = 'white'
                e.target.style.borderColor = '#ff6b6b'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.95)'
                e.target.style.color = '#333'
                e.target.style.borderColor = '#ddd'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div 
              className="react-astro-popup-content" 
              style={{ 
                textAlign: 'center',
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: 'calc(90vh - 100px)',
                paddingRight: '5px'
              }}
            >
              {loadingProduct ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '30px', color: '#ee5a24', marginBottom: '15px' }}></i>
                  <p style={{ fontSize: '16px', color: '#666' }}>Loading product details...</p>
                </div>
              ) : selectedProduct ? (
                <>
                  {/* Product Image */}
                  <div style={{ marginBottom: '20px' }}>
                    <img 
                      src={selectedProduct.product_image || 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} 
                      alt={selectedProduct.product_name || 'Product'}
                      style={{ 
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'cover', 
                        borderRadius: '15px',
                        border: '3px solid #f0f0f0',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://www.karmleela.com/uploads/setting/62096.png'
                      }}
                    />
                  </div>
                  
                  {/* Product Name */}
                  <h2 style={{ 
                    margin: '0 0 15px 0', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: '#333',
                    lineHeight: '1.3'
                  }}>
                    {selectedProduct.product_name || 'Product Name'}
                  </h2>
                  
                  {/* Product Price */}
                  <div style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '28px', 
                    color: '#ee5a24', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <i className="fas fa-rupee-sign" style={{ fontSize: '22px' }}></i>
                    <span>{selectedProduct.price || '0'}</span>
                    {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                      <span style={{ 
                        fontSize: '18px', 
                        color: '#999', 
                        textDecoration: 'line-through',
                        marginLeft: '10px'
                      }}>
                        ₹{selectedProduct.mrp}
                      </span>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div style={{ 
                    textAlign: 'left', 
                    margin: '20px 0', 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    {selectedProduct.description && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>
                          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#ee5a24' }}></i>
                          Description
                        </h4>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          color: '#666', 
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                    
                    {selectedProduct.quantity !== undefined && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>
                          <i className="fas fa-box" style={{ marginRight: '8px', color: '#ee5a24' }}></i>
                          Stock Available
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                          {selectedProduct.quantity || 0} {selectedProduct.unit || 'units'}
                        </p>
                      </div>
                    )}
                    
                    {selectedProduct.category_name && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>
                          <i className="fas fa-tag" style={{ marginRight: '8px', color: '#ee5a24' }}></i>
                          Category
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                          {selectedProduct.category_name}
                        </p>
                      </div>
                    )}
                    
                    {selectedProduct.hsn && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>
                          <i className="fas fa-barcode" style={{ marginRight: '8px', color: '#ee5a24' }}></i>
                          HSN Code
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                          {selectedProduct.hsn}
                        </p>
                      </div>
                    )}
                    
                    {selectedProduct.gst_percentage && (
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>
                          <i className="fas fa-percentage" style={{ marginRight: '8px', color: '#ee5a24' }}></i>
                          GST
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                          {selectedProduct.gst_percentage}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Purchase Form */}
                  {purchaseSuccess ? (
                    <div style={{ 
                      marginTop: '25px', 
                      padding: '20px', 
                      backgroundColor: '#d4edda', 
                      border: '1px solid #c3e6cb',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '40px', color: '#28a745', marginBottom: '10px' }}></i>
                      <h3 style={{ margin: '0 0 10px 0', color: '#155724', fontSize: '18px' }}>Order Placed Successfully!</h3>
                      <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>Your order has been placed. You will receive a confirmation shortly.</p>
                    </div>
                  ) : (
                    <>
                      {/* Quantity Selection */}
                      <div style={{ 
                        marginTop: '20px', 
                        padding: '20px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '10px',
                        border: '1px solid #e9ecef'
                      }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>
                          <i className="fas fa-shopping-bag" style={{ marginRight: '8px', color: '#ee5a24' }}></i>
                          Order Details
                        </h4>
                        
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct.quantity || 999}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              setQuantity(Math.max(1, Math.min(val, selectedProduct.quantity || 999)))
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        {/* Address Selection */}
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            Delivery Address <span style={{ color: 'red' }}>*</span>
                            {/* Debug info */}
                            <span style={{ 
                              marginLeft: '10px', 
                              fontSize: '12px', 
                              color: '#666', 
                              fontWeight: 'normal' 
                            }}>
                              ({userAddresses.length} address{userAddresses.length !== 1 ? 'es' : ''} loaded)
                            </span>
                          </label>
                          {(() => {
                            if (userAddresses.length > 0) {
                              // Create a stable key based on addresses, not time
                              const addressesKey = userAddresses.map(a => a.id || a.address_id).join('-')
                              
                              return (
                                <select
                                  key={`address-select-${addressesKey}`}
                                  value={selectedAddressId || ''}
                                  onChange={(e) => {
                                    const newAddressId = e.target.value
                                    setSelectedAddressId(newAddressId)
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#fff'
                                  }}
                                >
                                  <option value="">Select Address</option>
                                  {userAddresses.map((address, index) => {
                                    // Get address ID - try multiple possible fields
                                    const addressId = address.id || address.address_id || address.ID || address.ADDRESS_ID
                                    
                                    // Validate that we have a valid ID
                                    if (!addressId) {
                                      return null // Skip addresses without IDs
                                    }
                                    
                                    const addressName = address.name || 'Address'
                                    const addressLine = address.address || address.house_no || address.street_area || ''
                                    const city = address.city || ''
                                    const pincode = address.pincode || address.pin_code || ''
                                    const addressText = `${addressName}${addressLine ? ' - ' + addressLine : ''}${city ? ', ' + city : ''}${pincode ? ' - ' + pincode : ''}`
                                    
                                    const addressIdString = String(addressId)
                                    
                                    return (
                                      <option 
                                        key={`addr-${addressIdString}`} 
                                        value={addressIdString}
                                      >
                                        {addressText || 'Address'}
                                      </option>
                                    )
                                  })}
                                </select>
                              )
                            } else {
                              return (
                                <div style={{ 
                                  padding: '15px', 
                                  backgroundColor: '#fff3cd', 
                                  border: '1px solid #ffc107',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#856404'
                                }}>
                                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                                  No address found. Please add an address in your profile.
                                </div>
                              )
                            }
                          })()}
                        </div>

                        {/* Payment Method */}
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            Payment Method <span style={{ color: 'red' }}>*</span>
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          >
                            <option value="wallet">Wallet</option>
                            <option value="online">Online Payment</option>
                            <option value="cod">Cash on Delivery</option>
                          </select>
                        </div>

                        {/* Total Amount */}
                        <div style={{ 
                          marginTop: '15px', 
                          padding: '15px', 
                          backgroundColor: '#fff', 
                          border: '2px solid #ee5a24',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Total Amount</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ee5a24' }}>
                            ₹{((selectedProduct.price || 0) * quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Error Message */}
                      {purchaseError && (
                        <div style={{ 
                          marginTop: '15px', 
                          padding: '12px', 
                          backgroundColor: '#f8d7da', 
                          border: '1px solid #f5c6cb',
                          borderRadius: '8px',
                          color: '#721c24',
                          fontSize: '14px'
                        }}>
                          <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                          {purchaseError}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ 
                        marginTop: '25px', 
                        display: 'flex', 
                        gap: '15px', 
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        position: 'sticky',
                        bottom: '0',
                        backgroundColor: 'white',
                        paddingTop: '15px',
                        zIndex: 5
                      }}>
                        <button 
                          className="react-shop-buy-now-btn"
                          style={{ 
                            padding: '14px 40px', 
                            fontSize: '16px',
                            fontWeight: '600',
                            minWidth: '180px',
                            opacity: purchasing ? 0.6 : 1,
                            cursor: purchasing || !selectedAddressId || quantity < 1 ? 'not-allowed' : 'pointer'
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePurchase()
                          }}
                          disabled={purchasing || !selectedAddressId || quantity < 1}
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent default to ensure click works
                            e.preventDefault()
                          }}
                        >
                          {purchasing ? (
                            <>
                              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i>
                              Proceed to Buy
                            </>
                          )}
                        </button>
                        <button 
                          style={{ 
                            padding: '14px 40px', 
                            fontSize: '16px',
                            fontWeight: '600',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            minWidth: '180px',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => {
                            setShowProductModal(false)
                            setSelectedProduct(null)
                            setPurchaseError('')
                            setPurchaseSuccess(false)
                            setPurchasing(false) // Reset purchasing state when canceling
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                        >
                          <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '40px', color: '#ffc107', marginBottom: '15px' }}></i>
                  <p style={{ fontSize: '16px', color: '#666' }}>Product details not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legacy modal for app download (kept for backward compatibility) */}
      <div className="react-cusTom-overlay" id="cusTom-popupOverlay" style={{display: 'none'}}>
        <div className="react-cusTom-popup">
          <button className="react-cusTom-closeBtn" id="cusTom-closeModal"><i className="fa-solid fa-xmark"></i></button>
          <div className="react-astro-popup-content">
            <div className="react-astro-app-icon"><img src="https://www.karmleela.com/uploads/setting/62096.png" alt="" /></div>
            <p>Please download the Karmleela (Under Charveesh Enterprises) app to connect with an astrologer.</p>
            <a href="#" className="react-astro-playstore-btn" id="astro-playstoreBtn">
              <img src="https://jyotishaguru.com/front_theme/syniastropro/images/store2.png" alt="" />
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Shop
