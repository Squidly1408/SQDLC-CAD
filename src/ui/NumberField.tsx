import { useEffect, useState } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  step?: number
  min?: number
  onChange: (value: number) => void
}

export function NumberField({ label, value, step = 1, min, onChange }: NumberFieldProps) {
  const [text, setText] = useState(String(round(value)))

  useEffect(() => {
    setText(String(round(value)))
  }, [value])

  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )

  function commit() {
    const parsed = parseFloat(text)
    if (Number.isFinite(parsed)) {
      const clamped = min !== undefined ? Math.max(min, parsed) : parsed
      onChange(clamped)
      setText(String(round(clamped)))
    } else {
      setText(String(round(value)))
    }
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
