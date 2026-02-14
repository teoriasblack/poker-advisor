import { useState } from 'react'

// ==================== POKER LOGIC ====================

const HAND_RANKINGS = {
  // Premium hands
  'AA': { rank: 1, name: 'AA', strength: 100, category: 'premium' },
  'KK': { rank: 2, name: 'KK', strength: 98, category: 'premium' },
  'QQ': { rank: 3, name: 'QQ', strength: 95, category: 'premium' },
  'AKs': { rank: 4, name: 'AK♠', strength: 92, category: 'premium' },
  'AKo': { rank: 5, name: 'AKo', strength: 90, category: 'premium' },
  'JJ': { rank: 6, name: 'JJ', strength: 88, category: 'premium' },
  'AQs': { rank: 7, name: 'AQ♠', strength: 86, category: 'premium' },
  'AJs': { rank: 8, name: 'AJ♠', strength: 84, category: 'good' },
  'KQs': { rank: 9, name: 'KQ♠', strength: 82, category: 'good' },
  'TT': { rank: 10, name: 'TT', strength: 80, category: 'good' },
  'AKo': { rank: 11, name: 'AKo', strength: 78, category: 'good' },
  'AJo': { rank: 12, name: 'AJo', strength: 76, category: 'good' },
  'KJo': { rank: 13, name: 'KJo', strength: 74, category: 'medium' },
  'QJs': { rank: 14, name: 'QJ♠', strength: 72, category: 'medium' },
  '99': { rank: 15, name: '99', strength: 70, category: 'medium' },
  'ATs': { rank: 16, name: 'AT♠', strength: 68, category: 'medium' },
  'KQs': { rank: 17, name: 'KQ♠', strength: 66, category: 'medium' },
  '88': { rank: 18, name: '88', strength: 64, category: 'medium' },
  'QTs': { rank: 19, name: 'QT♠', strength: 62, category: 'medium' },
  'JTs': { rank: 20, name: 'JT♠', strength: 60, category: 'speculative' },
  '77': { rank: 21, name: '77', strength: 58, category: 'speculative' },
  'A9s': { rank: 22, name: 'A9♠', strength: 56, category: 'speculative' },
  'K9s': { rank: 23, name: 'K9♠', strength: 54, category: 'speculative' },
  'Q9s': { rank: 24, name: 'Q9♠', strength: 52, category: 'speculative' },
  'J9s': { rank: 25, name: 'J9♠', strength: 50, category: 'speculative' },
}

const POSITIONS = {
  'utg': { name: 'UTG (Early)', position: 1, isEarly: true },
  'utg1': { name: 'UTG+1', position: 2, isEarly: true },
  'utg2': { name: 'UTG+2', position: 3, isEarly: true },
  'mp': { name: 'MP (Middle)', position: 4, isEarly: false },
  'hj': { name: 'Hijack', position: 5, isEarly: false },
  'co': { name: 'Cutoff', position: 6, isLate: true },
  'btn': { name: 'Button', position: 7, isLate: true },
  'sb': { name: 'Small Blind', position: 8, isSB: true },
  'bb': { name: 'Big Blind', position: 9, isBB: true },
}

const BOARD_TYPES = {
  'dry': { name: 'Board Seco', description: 'Sin proyectos significativos', examples: ['A♠ K♦ 7♣', 'Q♠ J♦ 2♥'] },
  'paired': { name: 'Board Emparejado', description: 'Una carta compartida', examples: ['A♠ A♦ K♣', 'Q♦ Q♥ 8♠'] },
  'two_pair': { name: 'Two Pair', description: 'Dos pares posibles', examples: ['A♠ K♦ A♣ K♥'] },
  'set': { name: 'Set', description: 'Tres del mismo valor', examples: ['A♠ A♦ A♣'] },
  'straight_possible': { name: 'Escalera Posible', description: 'Hay 4 cartas consecutivas', examples: ['9♠ T♦ J♣ Q♦', '5♦ 6♠ 7♥ 8♣'] },
  'flush_possible': { name: 'Flush Posible', description: '3+ cartas del mismo palo', examples: ['A♠ K♠ 7♠', 'Q♦ J♦ 8♦'] },
  'wet': { name: 'Board Coordinado', description: 'Muchos proyectos posibles', examples: ['T♠ J♠ Q♠', '7♦ 8♦ 9♦ T♦'] },
  'rainbow': { name: 'Rainbow', description: 'Todos los palos diferentes', examples: ['A♠ K♦ 7♣'] },
  'monotone': { name: 'Monotone', description: '3+ del mismo palo', examples: ['A♠ K♠ Q♠', '7♦ J♦ 2♦'] },
}

function getHandStrength(hand, position, boardType, potSize, isIP) {
  let strength = 50
  let recommendation = ''
  let reasoning = []

  // Get base hand strength
  const handKey = hand.replace('♠', 's').replace('♥', 'h').replace('♦', 'd').replace('♣', 'c')
  const handInfo = HAND_RANKINGS[handKey] || { strength: 50, category: 'medium' }
  
  strength = handInfo.strength

  // Position adjustment
  const posInfo = POSITIONS[position]
  if (posInfo?.isEarly) {
    strength -= 15
    reasoning.push('Posición temprana - necesitamos manos más fuertes')
  } else if (posInfo?.isLate) {
    strength += 10
    reasoning.push('Posición tardía - podemos jugar más manos')
  }

  // Board texture adjustment
  if (boardType === 'dry') {
    if (handInfo.category === 'premium') {
      strength += 5
      reasoning.push('Board seco favorece manos fuertes')
    }
  } else if (boardType === 'wet' || boardType === 'flush_possible' || boardType === 'straight_possible') {
    if (handInfo.category === 'speculative') {
      strength += 10
      reasoning.push('Board Coordinado favorece proyectos')
    }
  }

  // IP/OOP adjustment
  if (isIP) {
    strength += 5
    reasoning.push('Tenemos posición - ventaja')
  } else {
    strength -= 5
    reasoning.push('Sin posición - cuidado extra')
  }

  // Pot size consideration
  if (potSize === 'small') {
    if (handInfo.category === 'speculative') {
      strength += 5
      reasoning.push('Bote pequeño - podemos ver más')
    }
  } else if (potSize === 'large') {
    if (handInfo.category !== 'premium') {
      strength -= 10
      reasoning.push('Bote grande - solo manos fuertes')
    }
  }

  // Determine recommendation
  if (strength >= 85) {
    recommendation = 'RAISE - 3-bet / 4-bet'
    reasoning.push('Mano muy fuerte - maximizamos valor')
  } else if (strength >= 70) {
    recommendation = 'CALL - pagar tiene sentido'
    reasoning.push('Mano decente - podemos ver el flop')
  } else if (strength >= 50) {
    recommendation = 'FOLD - mejorFold'
    reasoning.push('Mano marginal - fold es preferible')
  } else {
    recommendation = 'FOLD - fold claro'
    reasoning.push('Mano muy débil para esta situación')
  }

  return { strength: Math.max(0, Math.min(100, strength)), recommendation, reasoning }
}

function getFlopAdvice(hand, position, board, isIP, initiative) {
  let strength = 50
  let recommendation = ''
  let reasoning = []

  // Board analysis
  const suits = board.map(c => c.suit)
  const values = board.map(c => c.value)
  const isFlushPossible = suits.filter(s => suits.filter(x => x === s).length >= 3).length > 0
  
  // Check for straight possibilities
  const sortedValues = values.sort((a, b) => a - b)
  let straightCount = 0
  for (let i = 0; i < sortedValues.length - 1; i++) {
    if (sortedValues[i + 1] - sortedValues[i] === 1) straightCount++
  }
  const isStraightPossible = straightCount >= 2

  // Hand analysis
  const handValues = hand.map(c => c.value)
  const handSuits = hand.map(c => c.suit)
  const isPair = handValues[0] === handValues[1]
  const isSuited = handSuits[0] === handSuits[1]
  
  // Made hand checks
  let madeHand = null
  let handType = ''
  
  // Check for trips/set
  if (handValues[0] === values[0] || handValues[0] === values[1] || handValues[0] === values[2]) {
    madeHand = 'set'
    handType = 'SET - manos extremadamente fuertes'
    strength = 95
  }
  
  // Check for two pair
  const boardValues = values.filter(v => v === values[0] || v === values[1])
  if (boardValues.length === 2 && handValues[0] === boardValues[0]) {
    madeHand = 'two_pair'
    handType = 'TWO PAIR - muy fuerte'
    strength = 85
  }

  // Check for overpair
  if (isPair && Math.max(...handValues) > Math.max(...values)) {
    madeHand = 'overpair'
    handType = 'OVERPAIR - fuerte'
    strength = 75
  }

  // Check for top pair
  if (handValues.includes(Math.max(...values))) {
    madeHand = 'top_pair'
    handType = 'TOP PAIR - decente'
    strength = 60
  }

  // Check for flush draw
  if (isSuited) {
    const suit = handSuits[0]
    const boardSuitCount = suits.filter(s => s === suit).length
    if (boardSuitCount >= 1) {
      madeHand = 'flush_draw'
      handType = 'FLUSH DRAW - proyecto'
      strength = 45
    }
  }

  // Straight draws
  if (isStraightPossible) {
    madeHand = 'straight_draw'
    handType = 'STRAIGHT DRAW - proyecto'
    strength = 40
  }

  // Position and initiative adjustments
  if (isIP) strength += 8
  if (initiative === 'we_raised') strength += 10
  if (initiative === 'opponent_raised') strength -= 15

  // Determine action
  if (strength >= 80) {
    recommendation = 'VALUE BET -bet por valor'
    reasoning.push('Mano hecha fuerte - maximizar valor')
  } else if (strength >= 60) {
    recommendation = 'CHECK / CALL - controlar el pozo'
    reasoning.push('Mano decente pero vulnerable')
  } else if (strength >= 40) {
    recommendation = 'CHECK / FOLD - dependiendo de odds'
    reasoning.push('Proyecto o mano marginal')
  } else {
    recommendation = 'FOLD - salvo que sea muy barato'
    reasoning.push('Mano muy débil para continuar')
  }

  return { strength, recommendation, reasoning, handType: handType || 'Sin pareja'}
}

function getPotOddsRecommendation(potSize, betSize, outs) {
  const potOdds = (betSize / (potSize + betSize)) * 100
  const winProbability = (outs / 46) * 100
  
  const isCallProfitable = winProbability > potOdds
  
  return {
    potOdds: potOdds.toFixed(1) + '%',
    winProbability: winProbability.toFixed(1) + '%',
    outs,
    recommendation: isCallProfitable ? 'CALL - odds favorables' : 'FOLD - odds desfavorables',
    reasoning: isCallProfitable 
      ? `Tienes ${outs} outs (${winProbability.toFixed(1)}%) vs pot odds ${potOdds.toFixed(1)}%`
      : `Pot odds ${potOdds.toFixed(1)}% es mayor que tu probabilidad de ganar ${winProbability.toFixed(1)}%`
  }
}

// ==================== COMPONENTS ====================

function CardSelector({ label, value, onChange, options }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <select className="form-select" value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function HandSelector({ label, cards, onChange, slot }) {
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
  const suits = ['♠', '♥', '♦', '♣']
  
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <div className="d-flex gap-2">
        <select 
          className="form-select" 
          value={cards[slot]?.value || ''} 
          onChange={e => {
            const newCards = [...cards]
            newCards[slot] = { ...newCards[slot], value: e.target.value }
            onChange(newCards)
          }}
          style={{ maxWidth: '80px' }}
        >
          <option value="">Valor</option>
          {values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select 
          className="form-select" 
          value={cards[slot]?.suit || ''} 
          onChange={e => {
            const newCards = [...cards]
            newCards[slot] = { ...newCards[slot], suit: e.target.value }
            onChange(newCards)
          }}
          style={{ maxWidth: '80px' }}
        >
          <option value="">Palo</option>
          {suits.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
}

function AdviceCard({ title, advice, icon }) {
  const getColor = () => {
    if (advice.recommendation?.includes('RAISE') || advice.recommendation?.includes('BET')) return '#22c55e'
    if (advice.recommendation?.includes('CALL')) return '#eab308'
    if (advice.recommendation?.includes('FOLD')) return '#ef4444'
    return '#6b7280'
  }

  return (
    <div className="card mb-3" style={styles.adviceCard}>
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span style={{ fontSize: 24 }}>{icon}</span>
          <h5 className="mb-0" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h5>
        </div>
        <div style={{ 
          color: getColor(), 
          fontSize: 18, 
          fontWeight: 700,
          marginBottom: 12 
        }}>
          {advice.recommendation || 'Selecciona tu mano'}
        </div>
        {advice.strength !== undefined && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">Fortaleza</small>
              <small>{advice.strength}%</small>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${advice.strength}%`, backgroundColor: getColor() }}></div>
            </div>
          </div>
        )}
        {advice.handType && (
          <div className="mb-2">
            <span className="badge" style={styles.badge}>{advice.handType}</span>
          </div>
        )}
        {advice.reasoning && advice.reasoning.length > 0 && (
          <div>
            <small className="text-muted d-block mb-1">Análisis:</small>
            {advice.reasoning.map((r, i) => (
              <div key={i} className="d-flex gap-2 mb-1">
                <span style={{ color: '#22c55e' }}>•</span>
                <small style={{ color: '#9ca3af' }}>{r}</small>
              </div>
            ))}
          </div>
        )}
        {advice.outs && (
          <div className="mt-3 p-2 rounded" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Outs:</span>
              <span fw-bold>{advice.outs}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Probabilidad:</span>
              <span>{advice.winProbability}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Pot Odds:</span>
              <span>{advice.potOdds}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const [hand, setHand] = useState([{ value: '', suit: '' }, { value: '', suit: '' }])
  const [board, setBoard] = useState([{ value: '', suit: '' }, { value: '', suit: '' }, { value: '', suit: '' }])
  const [position, setPosition] = useState('btn')
  const [isIP, setIsIP] = useState(true)
  const [initiative, setInitiative] = useState('none')
  const [potSize, setPotSize] = useState('medium')
  const [betSize, setBetSize] = useState('')
  const [outs, setOuts] = useState('')
  const [activeTab, setActiveTab] = useState('preflop')

  const handString = hand[0].value + hand[1].suit + hand[1].value + hand[1].suit

  const preflopAdvice = getHandStrength(handString, position, 'dry', potSize, isIP)
  
  const hasBoard = board.some(c => c.value && c.suit)
  const flopAdvice = hasBoard ? getFlopAdvice(hand, position, board.filter(c => c.value), isIP, initiative) : null
  
  const potOddsAdvice = (betSize && potSize) ? getPotOddsRecommendation(
    parseFloat(potSize), 
    parseFloat(betSize), 
    parseInt(outs) || 0
  ) : null

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>♠️ Poker Advisor</h1>
        <p style={styles.subtitle}>Texas Hold'em - Consejos profesionales</p>
      </div>

      <div className="container">
        <ul className="nav nav-pills mb-4" style={styles.tabs}>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'preflop' ? 'active' : ''}`}
              onClick={() => setActiveTab('preflop')}
              style={activeTab === 'preflop' ? styles.activeTab : styles.tab}
            >
              Pre-Flop
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'flop' ? 'active' : ''}`}
              onClick={() => setActiveTab('flop')}
              style={activeTab === 'flop' ? styles.activeTab : styles.tab}
            >
              Flop/Turn
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'odds' ? 'active' : ''}`}
              onClick={() => setActiveTab('odds')}
              style={activeTab === 'odds' ? styles.activeTab : styles.tab}
            >
              Calculadora Odds
            </button>
          </li>
        </ul>

        <div className="row">
          <div className="col-lg-4">
            <div className="card mb-4" style={styles.card}>
              <div className="card-body">
                <h5 className="mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Tu Mano</h5>
                
                <HandSelector label="Carta 1" cards={hand} onChange={setHand} slot={0} />
                <HandSelector label="Carta 2" cards={hand} onChange={setHand} slot={1} />

                {activeTab === 'preflop' && (
                  <>
                    <CardSelector 
                      label="Tu Posición" 
                      value={position} 
                      onChange={setPosition}
                      options={Object.entries(POSITIONS).map(([k, v]) => ({ value: k, label: v.name }))}
                    />

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Posición vs Oponente</label>
                      <div className="d-flex gap-2">
                        <button 
                          className={`btn ${isIP ? 'btn-danger' : 'btn-outline-secondary'}`}
                          onClick={() => setIsIP(true)}
                          style={isIP ? styles.btnActive : styles.btnInactive}
                        >
                          Tengo posición
                        </button>
                        <button 
                          className={`btn ${!isIP ? 'btn-danger' : 'btn-outline-secondary'}`}
                          onClick={() => setIsIP(false)}
                          style={!isIP ? styles.btnActive : styles.btnInactive}
                        >
                          Sin posición
                        </button>
                      </div>
                    </div>

                    <CardSelector 
                      label="Tamaño del Pozo" 
                      value={potSize} 
                      onChange={setPotSize}
                      options={[
                        { value: 'small', label: 'Pequeño (<10bb)' },
                        { value: 'medium', label: 'Mediano (10-50bb)' },
                        { value: 'large', label: 'Grande (>50bb)' },
                      ]}
                    />
                  </>
                )}

                {activeTab === 'flop' && hasBoard && (
                  <>
                    <h6 className="mt-3 mb-2">Board</h6>
                    <HandSelector label="Flop 1" cards={board} onChange={setBoard} slot={0} />
                    <HandSelector label="Flop 2" cards={board} onChange={setBoard} slot={1} />
                    <HandSelector label="Flop 3" cards={board} onChange={setBoard} slot={2} />

                    <CardSelector 
                      label="Iniciativa" 
                      value={initiative} 
                      onChange={setInitiative}
                      options={[
                        { value: 'none', label: 'Sin iniciativa' },
                        { value: 'we_raised', label: 'Nosotros raisamos' },
                        { value: 'opponent_raised', label: 'Oponente raisó' },
                      ]}
                    />
                  </>
                )}

                {activeTab === 'odds' && (
                  <div className="mt-3">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Tamaño del Pozo ($)</label>
                      <input type="number" className="form-control" value={potSize} onChange={e => setPotSize(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Apuesta a pagar ($)</label>
                      <input type="number" className="form-control" value={betSize} onChange={e => setBetSize(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Outs (cartas que mejoran)</label>
                      <input type="number" className="form-control" value={outs} onChange={e => setOuts(e.target.value)} placeholder="Ej: 9 para flush draw" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            {activeTab === 'preflop' && (
              <AdviceCard 
                title="Recomendación Pre-Flop" 
                icon="🎯"
                advice={hand[0].value && hand[1].value ? preflopAdvice : { recommendation: 'Selecciona tu mano' }}
              />
            )}

            {activeTab === 'flop' && (
              <>
                <AdviceCard 
                  title="Análisis del Board" 
                  icon="🃏"
                  advice={hasBoard ? flopAdvice : { recommendation: 'Selecciona el board' }}
                />
                {hasBoard && (
                  <div className="card" style={styles.infoCard}>
                    <div className="card-body">
                      <h6 className="mb-3">Lectura del Board</h6>
                      <div className="row">
                        <div className="col-6 mb-2">
                          <span className="badge bg-secondary me-1">Tus cartas:</span>
                          <span style={{ color: '#fff' }}>
                            {hand[0].value}{hand[0].suit} {hand[1].value}{hand[1].suit}
                          </span>
                        </div>
                        <div className="col-6 mb-2">
                          <span className="badge bg-secondary me-1">Board:</span>
                          <span style={{ color: '#fff' }}>
                            {board.filter(c => c.value).map(c => c.value + c.suit).join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'odds' && (
              <AdviceCard 
                title="Calculadora de Odds" 
                icon="🧮"
                advice={potOddsAdvice || { recommendation: 'Ingresa los valores' }}
              />
            )}

            {/* Quick Reference */}
            <div className="card mt-4" style={styles.referenceCard}>
              <div className="card-body">
                <h6 className="mb-3">📖 Guía Rápida</h6>
                <div className="row">
                  <div className="col-6">
                    <small className="text-muted d-block mb-1"><strong style={{ color: '#22c55e' }}>RAISE</strong> → Apuesta/raisea</small>
                    <small className="text-muted d-block mb-1"><strong style={{ color: '#eab308' }}>CALL</strong> → Ve la apuesta</small>
                    <small className="text-muted d-block"><strong style={{ color: '#ef4444' }}>FOLD</strong> → Folda</small>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">IP = Tengo posición</small>
                    <small className="text-muted d-block mb-1">OOP = Sin posición</small>
                    <small className="text-muted d-block">C-bet = Apuesta de continuación</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <div className="container text-center">
          <small className="text-muted">♠️ Poker Advisor - Texas Hold'em | Para fines educativos</small>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    paddingBottom: 40,
  },
  header: {
    textAlign: 'center',
    padding: '40px 20px 20px',
    background: 'linear-gradient(180deg, rgba(220,38,38,0.1) 0%, transparent 100%)',
  },
  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize: 'clamp(28px, 5vw, 42px)',
    fontWeight: 700,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
  },
  tabs: {
    justifyContent: 'center',
  },
  tab: {
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
  },
  activeTab: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #334155',
    backdropFilter: 'blur(10px)',
  },
  select: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#fff',
  },
  btnActive: {
    background: '#dc2626',
    border: 'none',
    color: '#fff',
  },
  btnInactive: {
    background: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
  },
  adviceCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid #334155',
  },
  progressBar: {
    height: 6,
    background: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  badge: {
    background: '#334155',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: 4,
  },
  infoCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid #334155',
  },
  referenceCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid #334155',
  },
  footer: {
    marginTop: 40,
    padding: '20px 0',
    borderTop: '1px solid #1e293b',
  },
}

export default App
