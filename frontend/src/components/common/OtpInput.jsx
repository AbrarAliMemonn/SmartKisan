import { useRef } from 'react'

const OTP_LENGTH = 6

/**
 * Six separate digit boxes that behave like one field.
 * - typing moves to the next box
 * - Backspace / arrow keys move between boxes
 * - pasting (or SMS autofill) fills all boxes at once
 *
 * `value` is a plain string of up to 6 digits.
 */
export default function OtpInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = false,
}) {
  const refs = useRef([])

  const focusBox = (index) => {
    const box = refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]

    if (box) {
      box.focus()
    }
  }

  const handleChange = (index, event) => {
    const digits = event.target.value.replace(/\D/g, '')

    if (!digits) return

    let next

    if (digits.length === 1 && index < value.length) {
      // Replace a single existing digit
      next = value.slice(0, index) + digits + value.slice(index + 1)
      onChange(next)
      focusBox(index + 1)
      return
    }

    // Append / multi-digit input (autofill)
    next = (value.slice(0, index) + digits).slice(0, OTP_LENGTH)
    onChange(next)
    focusBox(next.length)
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()

      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1))
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index))
        focusBox(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)

    if (!pasted) return

    onChange(pasted)
    focusBox(pasted.length)
  }

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-3"
      role="group"
      aria-label="One-time verification code"
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={index === 0 ? undefined : 1}
          value={value[index] || ''}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className={`h-12 min-w-0 flex-1 rounded-xl border text-center text-lg font-semibold text-slate-900 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-xl ${
            hasError
              ? 'border-red-300 bg-red-50/40 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10'
          }`}
        />
      ))}
    </div>
  )
}
