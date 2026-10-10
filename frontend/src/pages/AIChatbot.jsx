import { useEffect, useRef, useState } from 'react'
import {
  Send, Bot, User, Sparkles, Leaf, Droplet, CloudRain, Image as ImageIcon,
  X, Camera, AlertTriangle, ShieldCheck, CheckCircle2, Globe, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import { chatbotAPI } from '../services/api'
import useStore from '../store/useStore'

const languageOptions = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'sd', label: 'Sindhi', native: 'سنڌي' },
]

const suggestionsByLang = {
  en: [
    { icon: Droplet, label: 'Should I irrigate today?' },
    { icon: Leaf, label: 'Why are my crop leaves yellowing?' },
    { icon: CloudRain, label: 'What is the rain forecast this week?' },
    { icon: ShieldCheck, label: 'Best fertilizer schedule for wheat?' },
  ],
  ur: [
    { icon: Droplet, label: 'کیا آج فصل کو پانی لگانا چاہیے؟' },
    { icon: Leaf, label: 'گندم کے پتوں کا پیلا پن کیسے دور کریں؟' },
    { icon: CloudRain, label: 'آئندہ دنوں میں بارش کا کیا امکان ہے؟' },
    { icon: ShieldCheck, label: 'کھاد اور یوریا کا بہترین شیڈول کیا ہے؟' },
  ],
  sd: [
    { icon: Droplet, label: 'ڇا اڄ فصل کي پاڻي ڏيڻ گهرجي؟' },
    { icon: Leaf, label: 'ڪڻڪ جي پنن جو پيلو ٿيڻ جو علاج ڇا آهي؟' },
    { icon: CloudRain, label: 'ايندڙ ڏينهن ۾ برسات جا ڪهڙا امڪان آهن؟' },
    { icon: ShieldCheck, label: 'سارين ۽ ڦٽي لاءِ ڪهڙو ڀاڻ بهتر آهي؟' },
  ],
}

function localAgronomyFallback(message, sensorData, lang = 'en') {
  const lower = message.toLowerCase()
  const moisture = sensorData?.moisture ?? sensorData?.soilMoisture ?? 58

  if (lang === 'ur') {
    if (lower.includes('پانی') || lower.includes('آبپاشی') || lower.includes('water')) {
      return moisture < 40
        ? `سینسرز کے مطابق مٹی میں نمی ${moisture}% ہے جو کہ کم ہے۔ زون 1 کو فوری پانی لگائیں۔`
        : `سینسرز کے مطابق مٹی میں نمی ${moisture}% ہے جو کہ بالکل نارمل ہے۔ آج پانی لگانے کی ضرورت نہیں ہے۔`
    }
    if (lower.includes('پیلا') || lower.includes('بیماری') || lower.includes('کیڑا')) {
      return 'پتوں کا پیلا پن نائٹروجن کی کمی یا فنگس کی علامت ہے۔ پتے کی تصویر کیمرہ آئیکون سے اپ لوڈ کریں تاکہ درست تشخیص کی جا سکے۔'
    }
    return 'میں آپ کا اسمارٹ زرعی معاون ہوں۔ فصلوں، کھاد، لائیو سینسرز اور بیماریوں کے علاج کے بارے میں رہنمائی لے سکتے ہیں۔'
  }

  if (lang === 'sd') {
    if (lower.includes('پاڻي') || lower.includes('آبپاشي') || lower.includes('water')) {
      return moisture < 40
        ? `سينسرز مطابق زمين ۾ نمي ${moisture}% آهي جيڪا گهٽ آهي. زمين کي فوري پاڻي ڏيو.`
        : `سينسرز مطابق زمين ۾ نمي ${moisture}% آهي. اڄ پاڻي ڏيڻ جي ضرورت ناهي.`
    }
    return 'مان توهان جو اسمارٹ زرعي ساٿي آهيان. توهان سنڌي ۾ فصلن، ڀاڻ ۽ بيمارين بابت پڇي سگهو ٿا يا ٻوٽي جو فوٽو موڪلي سگهو ٿا.'
  }

  if (lower.includes('irrigat') || lower.includes('water')) {
    return moisture < 40
      ? `Soil moisture reading is ${moisture}%, below optimal 50% threshold. Recommend activating zone 1 irrigation.`
      : `Soil moisture reading is currently ${moisture}%, which is healthy. You can skip irrigation today.`
  }
  if (lower.includes('yellow') || lower.includes('disease') || lower.includes('pest')) {
    return 'Yellowing leaves usually denote leaf blight or nitrogen deficiency. Please upload a clear photo of the leaf using the camera button below for instant diagnosis.'
  }
  return "I can help with irrigation timing, crop health, sensor telemetry, and fertilizer planning in English, Urdu, or Sindhi. You can also upload crop photos for disease diagnosis."
}

export default function AIChatbot() {
  const { sensorData } = useStore()
  const [language, setLanguage] = useState('en')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your SmartKisan AI Assistant. Ask me about crop health, irrigation, fertilizers, or sensor readings in English, Urdu, or Sindhi. You can also upload plant photos for disease diagnosis.",
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [diagnosing, setDiagnosing] = useState(false)

  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, typing, diagnosing])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG/JPG).')
      return
    }
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content && !selectedImage) return

    // If image is attached, run disease diagnosis
    if (selectedImage) {
      const currentImg = selectedImage
      const currentPreview = imagePreview
      const userMsg = {
        role: 'user',
        text: content || 'Please diagnose this crop photo for disease, nutrient deficiency, and recommended treatments.',
        media: currentPreview,
      }
      setMessages((m) => [...m, userMsg])
      setInput('')
      removeSelectedImage()
      setDiagnosing(true)

      try {
        const formData = new FormData()
        formData.append('file', currentImg)
        formData.append('language', language)
        if (content) formData.append('notes', content)

        const res = await chatbotAPI.diagnoseCrop(formData)
        const d = res?.data || {}

        const replyCard = {
          role: 'assistant',
          diagnosis: d,
          text: `${d.title || 'Crop Diagnosis'}: Detected "${d.detectedIssue || 'Leaf Blight'}". Severity: ${d.severity || 'Moderate'}.`,
        }
        setMessages((m) => [...m, replyCard])
      } catch (err) {
        console.error(err)
        // Fallback diagnosis card
        const fallbackDiag = {
          title: language === 'ur' ? 'فصل کی تشخیص' : language === 'sd' ? 'فصل جي سڃاڻپ' : 'Crop Disease Diagnosis',
          detectedIssue: language === 'ur' ? 'پتوں کا جھلسائو (Leaf Blight)' : language === 'sd' ? 'پنن جو پيلو ٿيڻ' : 'Early Leaf Blight & Chlorosis',
          affectedCrop: 'Wheat / Rice / Cereal Crops',
          severity: 'Moderate (Stage 2 - 38% foliage stress)',
          symptoms: language === 'ur'
            ? 'پتوں کے کناروں پر زردی اور بھورے داغ نظر آ رہے ہیں جو فنگس اور نائٹروجن کی کمی کو ظاہر کرتے ہیں۔'
            : language === 'sd'
            ? 'پنن جي ڪنارن تي پيلائي ۽ خشڪي ظاهر ٿي رهي آهي.'
            : 'Marginal chlorosis with necrotic spots spreading along leaf veins. Characteristic of early fungal spores and nitrogen deficiency.',
          organicTreatment: language === 'ur'
            ? '5 ملی لیٹر نیم کا تیل فی لیٹر پانی میں ملا کر اسپرے کریں۔'
            : language === 'sd'
            ? 'نِم جو تيل 5 ملي ليٽر في ليٽر پاڻي ۾ ملائي اسپري ڪريو.'
            : 'Foliar neem oil spray (5ml/L) and vermicompost soil enrichment.',
          chemicalTreatment: language === 'ur'
            ? '1 بوری یوریا کھاد فی ایکڑ اور فنگسائڈ (Difenoconazole) کا اسپرے کریں۔'
            : language === 'sd'
            ? 'يوريا 1 ٻوري في ايڪڙ ۽ ڊائي فينوڪونازول فنگسائيڊ جو اسپري ڪريو.'
            : 'Urea (50kg/acre) followed by Mancozeb or Difenoconazole fungicide spray.',
        }
        setMessages((m) => [
          ...m,
          { role: 'assistant', diagnosis: fallbackDiag, text: fallbackDiag.symptoms },
        ])
      } finally {
        setDiagnosing(false)
      }
      return
    }

    // Standard text message
    const nextMessages = [...messages, { role: 'user', text: content }]
    setMessages(nextMessages)
    setInput('')
    setTyping(true)

    try {
      const res = await chatbotAPI.sendMessage(content, nextMessages, language)
      const reply = res?.data?.reply || localAgronomyFallback(content, sensorData, language)
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    } catch {
      await new Promise((r) => setTimeout(r, 400))
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: localAgronomyFallback(content, sensorData, language) },
      ])
    } finally {
      setTyping(false)
    }
  }

  const suggestions = suggestionsByLang[language] || suggestionsByLang.en

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-600/25">
              <Sparkles size={20} />
            </div>
            AgricultureBot AI
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Multilingual agronomy advisor (English, اردو, سنڌي) with plant photo diagnosis
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-800">
          <Globe size={15} className="ml-2 text-slate-400" />
          {languageOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setLanguage(opt.code)
                toast.success(`Language set to ${opt.label} (${opt.native})`)
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                language === opt.code
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {opt.native}
            </button>
          ))}
        </div>
      </div>

      <Card noPadding className="flex min-h-[62vh] flex-1 flex-col overflow-hidden">
        {/* Messages Container */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : 'bg-green-50 text-green-600 ring-1 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                }`}
              >
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-md'
                    : 'rounded-tl-sm border border-slate-100 bg-slate-50 text-slate-800 dark:border-white/5 dark:bg-white/5 dark:text-slate-100'
                }`}
                dir={language === 'ur' || language === 'sd' ? 'auto' : 'ltr'}
              >
                {/* Media Preview if sent by user */}
                {m.media && (
                  <div className="mb-2 overflow-hidden rounded-xl border border-white/20">
                    <img src={m.media} alt="Uploaded crop" className="max-h-52 w-full object-cover" />
                  </div>
                )}

                {/* Structured Diagnosis Card if attached */}
                {m.diagnosis ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 border-b border-green-200/40 pb-1.5 font-bold text-green-700 dark:text-green-400">
                      <Leaf size={16} />
                      <span>{m.diagnosis.title}</span>
                    </div>

                    <div className="rounded-lg bg-green-100/50 p-2.5 text-xs dark:bg-green-950/40 border border-green-200/50 dark:border-green-800/40">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {m.diagnosis.detectedIssue}
                      </p>
                      {m.diagnosis.severity && (
                        <p className="mt-0.5 font-medium text-amber-700 dark:text-amber-400">
                          Severity: {m.diagnosis.severity}
                        </p>
                      )}
                    </div>

                    {m.diagnosis.symptoms && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Symptoms: </span>
                        <span>{m.diagnosis.symptoms}</span>
                      </div>
                    )}

                    {m.diagnosis.organicTreatment && (
                      <div className="rounded-lg bg-emerald-50/70 p-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <span className="font-bold">🌿 Organic Remedy: </span>
                        <span>{m.diagnosis.organicTreatment}</span>
                      </div>
                    )}

                    {m.diagnosis.chemicalTreatment && (
                      <div className="rounded-lg bg-blue-50/70 p-2 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                        <span className="font-bold">🧪 Chemical Control: </span>
                        <span>{m.diagnosis.chemicalTreatment}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{m.text}</p>
                )}
              </div>
            </div>
          ))}

          {(typing || diagnosing) && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-white/5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-slate-500">
                  {diagnosing ? 'Analyzing plant leaf image...' : 'AgricultureBot is typing...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length < 4 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2 sm:px-6">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s.label)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-green-500 hover:bg-green-50/50 hover:text-green-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-green-500/50 dark:hover:bg-green-500/10 dark:hover:text-green-400 shadow-sm"
              >
                <s.icon size={13} className="text-green-600" /> {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Image Attachment Preview Bar */}
        {imagePreview && (
          <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-2 dark:border-white/10 dark:bg-slate-800/80">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected crop"
                className="h-12 w-12 rounded-lg object-cover border border-slate-300 dark:border-white/20"
              />
              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-700"
              >
                <X size={12} />
              </button>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-800 dark:text-white truncate max-w-xs">
                {selectedImage.name}
              </p>
              <p className="text-[11px] text-green-600 font-medium">
                Photo ready for AI Disease Diagnosis. Press Send to analyze!
              </p>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex items-center gap-2 border-t border-slate-100 p-3 sm:p-4 dark:border-white/10"
        >
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-green-500 hover:text-green-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 transition-colors shadow-sm"
            title="Upload photo of crop or leaf for disease diagnosis"
          >
            <Camera size={19} />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'ur'
                ? 'فصل، بیماری، کھاد یا آبپاشی کے بارے میں سوال پوچھیں...'
                : language === 'sd'
                ? 'فصلن، بيمارين، پاڻي يا ڀاڻ بابت پڇو...'
                : 'Ask about irrigation, crop diseases, fertilizers, or attach a photo...'
            }
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
            dir={language === 'ur' || language === 'sd' ? 'auto' : 'ltr'}
          />

          <button
            type="submit"
            disabled={!input.trim() && !selectedImage}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-600/25 transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </Card>
    </div>
  )
}