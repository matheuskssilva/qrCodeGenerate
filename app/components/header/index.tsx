import React from 'react'
import { Hero } from '../hero'

export const Header = () => {
  return (
    <div className='flex flex-col items-center justify-center mt-20'>
        <h2 className='font-bold text-3xl'>Gerar QR Code</h2>
        <Hero />
      </div>
  )
}
