# 🌍 Climate Scenario Analyzer

### TCFD-Aligned Climate Risk Modeling Platform

An AI-powered climate scenario analysis tool that models how 1.5°C, 2°C, and 3°C+ warming pathways affect publicly traded companies through 2050.

![TCFD](https://img.shields.io/badge/TCFD-Aligned-00E5A0?style=for-the-badge) ![NGFS](https://img.shields.io/badge/NGFS-Scenarios-00D4FF?style=for-the-badge) ![AI](https://img.shields.io/badge/AI-Powered-FFD166?style=for-the-badge) ![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=white)

---

## What It Does

Enter a stock ticker. The AI agent autonomously researches the company's emissions profile, climate strategy, and physical asset exposure, then models risk impacts across three NGFS-aligned warming scenarios:

**🟢 1.5°C Paris-Aligned** — Aggressive decarbonization, net-zero by 2050

**🟡 2°C Delayed Transition** — Moderate policy action, carbon pricing by 2035

**🔴 3°C+ Hot House World** — Business as usual, severe physical impacts

### For each scenario, the platform generates:

- **Physical Risk Analysis** — floods, heat stress, sea level rise, extreme weather impacts on assets and supply chains
- **Transition Risk Analysis** — carbon pricing, stranded assets, technology disruption, market shifts
- **Financial Impact Estimates** — revenue at risk %, CAPEX requirements, carbon cost impact
- **Regulatory Exposure** — policy risk, compliance costs, disclosure requirements
- **Strategic Opportunities** — green revenue, adaptation advantages, market positioning

### Interactive Visualizations:

- **Radar chart** overlaying all three scenarios across five risk dimensions
- **Area chart** projecting cumulative risk trajectory from 2025 to 2050
- **Bar chart** comparing financial impacts across scenarios
- **Risk score meters** with detailed factor breakdowns
- **Scenario toggle** to switch between warming pathways

---

## Architecture

```
Stock Ticker Input
       │
       ├──→ Call 1: Company climate data research (emissions, strategy, exposure)
       │         ↓ (3-second rate limit buffer)
       └──→ Call 2: Scenario modeling (1.5°C / 2°C / 3°C+ impacts, timeline, financials)
       │
       ▼
  Assembled Data → Interactive Visualization Dashboard
```

Two focused AI calls with real-time web search, structured JSON extraction, and automated retry logic. Each call researches specific data and returns structured results.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Recharts, Vite |
| AI Engine | Anthropic Claude API with Web Search |
| Backend | Vercel Serverless Functions |
| Design | Custom dark scientific dashboard (Outfit + JetBrains Mono) |
| Frameworks | TCFD, NGFS climate scenarios, IEA pathways |

---

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/climate-scenario-analyzer.git
cd climate-scenario-analyzer
npm install
npm run dev
```

### Deploy to Vercel

1. Push to GitHub
2. Import at vercel.com
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy

---

## Why This Matters

TCFD scenario analysis is now mandatory or expected under ISSB, CSRD, and SEC climate disclosure rules. Most companies still do this manually or pay consultancies $50-200k. This tool demonstrates how agentic AI can automate climate risk modeling at a fraction of the cost.

---

## Author

Built by an ESG/Sustainability professional at the intersection of climate science, financial risk, and AI engineering.

## License

MIT
