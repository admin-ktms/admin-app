/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ktms: {
          bg: '#080A0F',          // Midnight Black (Base Canvas)
          panel: '#11151D',       // Deep Charcoal (Sidebars, headers, table rows)
          surface: '#1A2230',     // Stadium Slate (Modals, cards, popovers)
          border: '#2A3342',      // Steel Border (Hairline dividers, inputs, outlines)
          text: '#F5F7FA',        // Ice White (Primary values, headings)
          muted: '#A5AFBF',       // Cool Silver (Timestamps, labels, IDs)
          cyan: '#00D9FF',        // Electric Cyan (Primary CTA, links, active state)
          gold: '#FFC857',        // Championship Gold (GM badges, prize awards)
          green: '#42D392',       // Victory Green (Active status, confirmed payments)
          coral: '#FF6B75',       // Alert Coral (Disputes, walkovers, bans)
        },
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.85rem' }],
      },
    },
  },
  plugins: [],
};
