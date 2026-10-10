// // Shared display helpers for the SmartAgri marketplace.
// // Keeping these in one place stops "Rs." / "Rs" / "PKR" drifting apart
// // between the product card, cart, checkout and order screens.

// export const formatPKR = (value) => {
//   const amount = Number(value)

//   if (!Number.isFinite(amount)) return 'Rs. 0'

//   return `Rs. ${amount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
// }

// export const formatDate = (value) => {
//   if (!value) return '—'

//   const d = new Date(value)

//   if (Number.isNaN(d.getTime())) return String(value)

//   return d.toLocaleDateString('en-PK', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   })
// }

// export const formatDateTime = (value) => {
//   if (!value) return '—'

//   const d = new Date(value)

//   if (Number.isNaN(d.getTime())) return String(value)

//   return `${formatDate(value)} · ${d.toLocaleTimeString('en-PK', {
//     hour: '2-digit',
//     minute: '2-digit',
//   })}`
// }


// Shared display helpers for the SmartAgri marketplace.
// Keeping these in one place stops "Rs." / "Rs" / "PKR" drifting apart
// between the product card, cart, checkout and order screens.

export const formatPKR = (value) => {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return 'Rs. 0'

  return `Rs. ${amount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
}

export const formatDate = (value) => {
  if (!value) return '—'

  const d = new Date(value)

  if (Number.isNaN(d.getTime())) return String(value)

  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (value) => {
  if (!value) return '—'

  const d = new Date(value)

  if (Number.isNaN(d.getTime())) return String(value)

  return `${formatDate(value)} · ${d.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}
