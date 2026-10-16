'use client'

import Image from 'next/image'

type MoanaLogoProps = {
  /** Vermelho no painel escuro; branco para contraste em fundos escuros compactos. */
  variant?: 'red' | 'white'
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

/**
 * Logo oficial da Construtora Moana (marca A em triângulos).
 */
export function MoanaLogo({
  variant = 'red',
  className = 'h-14 w-auto object-contain',
  width = 190,
  height = 68,
  priority = false,
}: MoanaLogoProps) {
  const src = variant === 'white' ? '/logo-white.png' : '/logo.png'

  return (
    <Image
      src={src}
      alt="Construtora Moana"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}
