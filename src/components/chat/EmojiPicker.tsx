/**
 * =====================================================
 * EMOJI PICKER
 * =====================================================
 * Selector de emojis para el chat
 * Features: Categorías, búsqueda, recientes
 * Fecha: 19 Nov 2025
 * Versión: v3.6.5
 * =====================================================
 */

import React, { useState, useMemo } from 'react';
import { Search, Smile, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/forms/Input';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

// Categorías de emojis
const EMOJI_CATEGORIES = {
  recientes: {
    name: 'Recientes',
    icon: '🕐',
    emojis: [] as string[] // Se llenará dinámicamente
  },
  caras: {
    name: 'Caras',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴']
  },
  gestos: {
    name: 'Gestos',
    icon: '👍',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪']
  },
  corazones: {
    name: 'Corazones',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💋']
  },
  animales: {
    name: 'Animales',
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔']
  },
  comida: {
    name: 'Comida',
    icon: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🌮', '🌯', '🥪', '🍖', '🍗', '🥩', '🍠', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🦪', '🍣', '🍤', '🍥', '🥮', '🍢', '🧆', '🥘', '🍲', '🍝', '🥫', '🥣', '🥧', '🍰', '🎂', '🧁', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜']
  },
  actividades: {
    name: 'Actividades',
    icon: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻']
  },
  lugares: {
    name: 'Lugares',
    icon: '🏠',
    emojis: ['🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁']
  },
  objetos: {
    name: 'Objetos',
    icon: '💎',
    emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺']
  },
  simbolos: {
    name: 'Símbolos',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭']
  }
};

// Obtener emojis recientes del localStorage
const getRecentEmojis = (): string[] => {
  try {
    const recent = localStorage.getItem('recent_emojis');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
};

// Guardar emoji reciente
const saveRecentEmoji = (emoji: string) => {
  try {
    const recent = getRecentEmojis();
    const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, 30);
    localStorage.setItem('recent_emojis', JSON.stringify(updated));
  } catch {
    // Ignorar errores de localStorage
  }
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState('caras');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(getRecentEmojis());

  // Categorías con recientes actualizados
  const categories = useMemo(() => {
    return {
      ...EMOJI_CATEGORIES,
      recientes: {
        ...EMOJI_CATEGORIES.recientes,
        emojis: recentEmojis
      }
    };
  }, [recentEmojis]);

  // Filtrar emojis por búsqueda
  const filteredEmojis = useMemo(() => {
    if (!searchQuery) {
      return categories[activeCategory as keyof typeof categories].emojis;
    }

    // Buscar en todas las categorías
    const allEmojis = Object.values(categories)
      .flatMap(cat => cat.emojis);
    
    return allEmojis.filter((emoji, index, self) => 
      self.indexOf(emoji) === index // Eliminar duplicados
    );
  }, [searchQuery, activeCategory, categories]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Emojis
          </h3>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {Object.entries(categories).map(([key, category]) => {
            if (key === 'recientes' && category.emojis.length === 0) return null;
            
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  activeCategory === key
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={category.name}
              >
                <span className="text-xl">{category.icon}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 h-64 overflow-y-auto">
        {filteredEmojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Smile className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No se encontraron emojis' : 'Usa emojis para ver recientes'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="p-2 text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 text-center">
        Haz clic en un emoji para agregarlo
      </div>
    </motion.div>
  );
};

export default EmojiPicker;


