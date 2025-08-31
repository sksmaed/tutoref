/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",

		// Or if using `src` directory:
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					100: "#FEF7F1",
					700: "#F1994A", 
					900: "#ED7A13"
				},
				secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))',
				100: "#F4F7F0",
				700: "#728A47",       // ✅ 新增：Secondary/700（自然）
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				black: {
					100: "#F1F1F1",
					200: "#D4D4D4",
					300: "#B8B8B8",
					400: "#9C9C9C",
					500: "#808080",
					700: "#474747",
					900: "#0D0D0D",
				},
				category: {
				nature:  "#728A47", // 自然（Secondary/700）
				social:  "#F1994A", // 社會（Primary/700）
				general: "#7F478A", // 綜合
				info:    "#6392B5", // 資訊
				art:     "#C85F5F", // 藝文
				chinese: "#C1B349", // 國語
				health:  "#3D9375", // 健教
				morning: "#C4789A", // 晨讀
				english: "#8E5C36", // 英文
				other:   "#0D0D0D", // 其他（Black/900）
				},
				error: {
					border: "#F24822"
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}

