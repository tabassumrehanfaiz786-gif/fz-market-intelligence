export const fixtureSource = 'FZ reproducible fixture · FZ-DEMO-1 · not market observations';
export const fixtureTimestamp = '2026-01-09T16:00:00Z';
export const funds = [
 { ticker:'IBIT', issuer:'BlackRock', name:'iShares Bitcoin Trust', net:145.2, aum:52000 },
 { ticker:'FBTC', issuer:'Fidelity', name:'Fidelity Wise Origin Bitcoin Fund', net:62.4, aum:18400 },
 { ticker:'GBTC', issuer:'Grayscale', name:'Grayscale Bitcoin Trust ETF', net:-81.5, aum:15800 },
 { ticker:'BTC', issuer:'Grayscale', name:'Grayscale Bitcoin Mini Trust ETF', net:18.9, aum:4200 },
 { ticker:'ARKB', issuer:'ARK / 21Shares', name:'ARK 21Shares Bitcoin ETF', net:27.3, aum:3600 },
 { ticker:'BITB', issuer:'Bitwise', name:'Bitwise Bitcoin ETF', net:22.6, aum:3200 },
 { ticker:'HODL', issuer:'VanEck', name:'VanEck Bitcoin ETF', net:8.7, aum:1200 },
 { ticker:'BRRR', issuer:'CoinShares', name:'CoinShares Valkyrie Bitcoin Fund', net:-4.2, aum:780 },
 { ticker:'EZBC', issuer:'Franklin Templeton', name:'Franklin Bitcoin ETF', net:5.1, aum:670 },
 { ticker:'BTCO', issuer:'Invesco / Galaxy', name:'Invesco Galaxy Bitcoin ETF', net:3.8, aum:560 },
];
export const dailyFlows = [
 {date:'2026-01-05',flow:118.4,price:87200,spot:220,perpetual:440},
 {date:'2026-01-06',flow:-64.2,price:86800,spot:-180,perpetual:-420},
 {date:'2026-01-07',flow:205.6,price:87150,spot:360,perpetual:90},
 {date:'2026-01-08',flow:87.1,price:86700,spot:510,perpetual:-240},
 {date:'2026-01-09',flow:208.3,price:86642.5,spot:428.51,perpetual:-187.34},
];
export const replenishments = [
 { id:'SIM-IC-001',price:86400,side:'buy',displayed:12,executed:82.6,count:7,replenished:71.4,first:'2026-01-09T15:21:00Z',last:'2026-01-09T15:28:00Z' },
 { id:'SIM-IC-002',price:86800,side:'sell',displayed:18,executed:91.2,count:5,replenished:68.2,first:'2026-01-09T15:32:00Z',last:'2026-01-09T15:38:00Z' },
 { id:'SIM-IC-003',price:86000,side:'buy',displayed:8,executed:19.4,count:2,replenished:13.2,first:'2026-01-09T15:40:00Z',last:'2026-01-09T15:42:00Z' },
];
export const providers = [
 {name:'Bitcoin ETF reporting',kind:'Fund-level net flows',status:'UNAVAILABLE',coverage:'No licensed reporting source connected',cadence:'Daily reporting',required:'Dated fund observations, citation and redistribution licence'},
 {name:'BTCUSDT spot depth',kind:'Snapshots + sequenced updates',status:'UNAVAILABLE',coverage:'No recorded order-book history',cadence:'Exchange stream',required:'Licensed exchange feed, snapshots and gap recovery'},
 {name:'BTCUSDT perpetual depth',kind:'Linear perpetual · USDT',status:'UNAVAILABLE',coverage:'No recorded derivatives history',cadence:'Exchange stream',required:'Depth, trades, funding and open-interest coverage'},
 {name:'Institutional news',kind:'Licensed metadata feed',status:'UNAVAILABLE',coverage:'No news source connected',cadence:'Provider dependent',required:'Original links, publication times and usage rights'},
];
export const demoNews = [
 {id:'SIM-N-01',headline:'Synthetic scenario: cautious institutional commentary',sentiment:'bearish',date:'2026-01-09T12:00:00Z',type:'Simulated opinion',explanation:'A controlled test scenario for bearish sentiment against positive fund flows. This is not a published news story.'},
 {id:'SIM-N-02',headline:'Synthetic scenario: optimistic adoption commentary',sentiment:'bullish',date:'2026-01-06T11:00:00Z',type:'Simulated opinion',explanation:'A controlled test scenario for bullish sentiment against negative fund flows. No publisher or external source is claimed.'},
];
