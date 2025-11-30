import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 倒计时动画组件
 * @param {boolean} isActive - 是否激活倒计时
 * @param {Function} onComplete - 倒计时完成回调
 */
export default function CountdownOverlay({ isActive, onComplete }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (!isActive) {
      setCount(3)
      return
    }

    if (count === 0) {
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setCount(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isActive, count, onComplete])

  if (!isActive) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <AnimatePresence mode="wait">
        {count > 0 && (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-white font-bold text-9xl"
          >
            {count}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
