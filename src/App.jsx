import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import GamePage from './components/GamePage'
import { GameLang as kmLang, CATEGORIES as kmCats } from './data/lang-km'
import { GameLang as enLang, CATEGORIES as enCats } from './data/lang-en'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/play/km" element={<GamePage key="km" GameLang={kmLang} CATEGORIES={kmCats} />} />
      <Route path="/play/en" element={<GamePage key="en" GameLang={enLang} CATEGORIES={enCats} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
