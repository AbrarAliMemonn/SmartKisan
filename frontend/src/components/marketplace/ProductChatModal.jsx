import { useState, useEffect, useRef } from 'react'
import { X, Send, Tag, MessageCircle, BadgeCheck, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import { chatAPI } from '../../services/api'
import websocketService from '../../services/websocket'
import { formatPKR } from '../../utils/format'

export default function ProductChatModal({ isOpen, onClose, product, seller }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [showOfferInput, setShowOfferInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null
    } catch {
      return null
    }
  })()

  const recipientId = seller?.userId || seller?.id || product?.sellerId
  const recipientName = seller?.businessName || seller?.storeName || product?.sellerName || 'Seller'

  useEffect(() => {
    if (!isOpen || !recipientId) return

    loadHistory()

    const handleIncomingMessage = (newMsg) => {
      if (
        (newMsg.senderId === recipientId && newMsg.recipientId === currentUser?.id) ||
        (newMsg.senderId === currentUser?.id && newMsg.recipientId === recipientId)
      ) {
        setMessages((prev) => [...prev, newMsg])
      }
    }

    websocketService.on('chatMessage', handleIncomingMessage)

    return () => {
      websocketService.off('chatMessage', handleIncomingMessage)
    }
  }, [isOpen, recipientId, product?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const res = await chatAPI.getHistory(recipientId, product?.id)
      const data = res?.data?.data || res?.data || []
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load chat history', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!currentUser) {
      toast.error('Please log in to chat with the seller.')
      return
    }
    if (!inputText.trim() && !offerPrice) return

    setSending(true)
    try {
      const payload = {
        recipientId: Number(recipientId),
        recipientName: recipientName,
        productId: product?.id ? Number(product.id) : null,
        productTitle: product?.title || product?.name || '',
        productImage: product?.image || product?.imageUrl || '',
        message: inputText.trim() || `Offer submitted for ${formatPKR(Number(offerPrice))}`,
        offerPrice: offerPrice ? Number(offerPrice) : null,
      }

      const res = await chatAPI.sendMessage(payload)
      const savedMsg = res?.data?.data || res?.data

      if (savedMsg) {
        setMessages((prev) => [...prev, savedMsg])
      }

      setInputText('')
      setOfferPrice('')
      setShowOfferInput(false)
      toast.success(offerPrice ? 'Price offer sent to seller!' : 'Message sent!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[620px] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <MessageCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white">
                <span>{recipientName}</span>
                <BadgeCheck size={16} className="text-blue-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct Product Negotiation & Inquiry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Summary Banner */}
        {product && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-green-50/50 px-4 py-2.5 dark:border-white/5 dark:bg-green-950/20">
            <div className="flex items-center gap-2.5 min-w-0">
              {(product.image || product.imageUrl) && (
                <img
                  src={product.image || product.imageUrl}
                  alt={product.title}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover border border-green-200/50"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                  {product.title}
                </p>
                <p className="text-xs font-bold text-green-600 dark:text-green-400">
                  {formatPKR(product.price)} <span className="text-[11px] font-normal text-slate-500">/ {product.unit || 'unit'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOfferInput(!showOfferInput)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              <Tag size={13} /> Make Offer
            </button>
          </div>
        )}

        {/* Offer Input Drawer */}
        {showOfferInput && (
          <div className="border-b border-green-200 bg-green-100/40 p-3 dark:border-green-800/40 dark:bg-green-900/20">
            <p className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Propose your desired buying price:
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">PKR</span>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-12 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-green-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!offerPrice || sending}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Send Offer
              </button>
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Loading chat history...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <MessageCircle size={36} className="mb-2 stroke-1 opacity-50" />
              <p className="text-sm font-medium">Start conversation with the seller</p>
              <p className="text-xs text-slate-400">
                Ask about availability, delivery options, bulk discounts, or negotiate pricing.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === currentUser?.id
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isMine
                        ? 'rounded-br-none bg-green-600 text-white shadow-sm'
                        : 'rounded-bl-none border border-slate-200 bg-slate-100 text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {msg.offerPrice && (
                      <div className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold">
                        <Tag size={12} /> Proposed Price: {formatPKR(msg.offerPrice)}
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.message}</p>
                  </div>
                  <span className="mt-1 text-[10px] text-slate-400">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Just now'}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message or question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm outline-none transition-all placeholder:text-slate-400 focus:border-green-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={(!inputText.trim() && !offerPrice) || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
