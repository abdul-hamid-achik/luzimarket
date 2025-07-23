import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 140,
          background: 'linear-gradient(135deg, #fef3f3 0%, #fff9f9 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
        }}
      >
        {/* Flower SVG Icon */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flower petals */}
          <path
            d="M100 40C100 20 80 0 60 0C40 0 20 20 20 40C20 60 40 80 60 80C65 80 70 79 74 77C72 83 70 90 70 97C70 97 85 85 100 70C100 60 100 50 100 40Z"
            fill="#333"
            opacity="0.9"
          />
          <path
            d="M160 40C160 20 180 0 200 0C220 0 240 20 240 40C240 60 220 80 200 80C195 80 190 79 186 77C188 83 190 90 190 97C190 97 175 85 160 70C160 60 160 50 160 40Z"
            fill="#333"
            opacity="0.9"
            transform="translate(-60, 0)"
          />
          <path
            d="M130 100C150 100 170 80 170 60C170 40 150 20 130 20C110 20 90 40 90 60C90 65 91 70 93 74C87 72 80 70 73 70C73 70 85 85 100 100C110 100 120 100 130 100Z"
            fill="#333"
            opacity="0.9"
          />
          <path
            d="M130 160C150 160 170 180 170 200C170 220 150 240 130 240C110 240 90 220 90 200C90 195 91 190 93 186C87 188 80 190 73 190C73 190 85 175 100 160C110 160 120 160 130 160Z"
            fill="#333"
            opacity="0.9"
            transform="translate(0, -60)"
          />
          <path
            d="M70 130C70 150 50 170 30 170C10 170 -10 150 -10 130C-10 110 10 90 30 90C35 90 40 91 44 93C42 87 40 80 40 73C40 73 55 85 70 100C70 110 70 120 70 130Z"
            fill="#333"
            opacity="0.9"
            transform="translate(30, 0)"
          />
          {/* Center circle */}
          <circle cx="100" cy="100" r="25" fill="#333" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}